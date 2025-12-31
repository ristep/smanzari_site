#!/bin/bash

#===============================================================================
# restart-containers.sh
# A comprehensive script for restarting/rebuilding Docker containers
# Optimized for GitHub Actions CI/CD pipelines
#===============================================================================

set -euo pipefail

# Colors for output (disabled in CI environments for cleaner logs)
if [[ "${CI:-false}" == "true" ]] || [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
    RED=""
    GREEN=""
    YELLOW=""
    BLUE=""
    NC=""
else
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
fi

# Default values
ACTION="restart"
SERVICES=""
BUILD_FLAG=""
FORCE_RECREATE=""
PULL_FLAG=""
REMOVE_ORPHANS="--remove-orphans"
TIMEOUT=60
COMPOSE_FILE="docker-compose.yml"
PROJECT_DIR=""
VERBOSE=false
DRY_RUN=false
PRUNE_AFTER=false

# Services to exclude by default (pgadmin is started manually)
EXCLUDED_SERVICES="pgadmin"

# Services to skip health checks for
SKIP_HEALTH_CHECK="frontend pgadmin"

#===============================================================================
# Helper Functions
#===============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# GitHub Actions specific logging
gh_group_start() {
    if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
        echo "::group::$1"
    else
        log_info "=== $1 ==="
    fi
}

gh_group_end() {
    if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
        echo "::endgroup::"
    fi
}

gh_set_output() {
    if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
        echo "$1=$2" >> "$GITHUB_OUTPUT"
    fi
}

gh_warning() {
    if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
        echo "::warning::$1"
    else
        log_warn "$1"
    fi
}

gh_error() {
    if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
        echo "::error::$1"
    else
        log_error "$1"
    fi
}

usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS] [SERVICES...]

A script for restarting/rebuilding Docker containers, optimized for GitHub Actions.

OPTIONS:
    -a, --action ACTION     Action to perform: restart, rebuild, stop, start, down, up
                            (default: restart)
    -b, --build             Force rebuild of images before starting
    -f, --file FILE         Specify docker-compose file (default: docker-compose.yml)
    -d, --dir DIR           Project directory containing docker-compose.yml
    -p, --pull              Pull latest images before starting
    -r, --force-recreate    Force recreation of containers
    -t, --timeout SECONDS   Timeout for container operations (default: 60)
    --all                   Include all services (including pgadmin)
    --prune                 Prune unused images/volumes after operation
    --dry-run               Show commands without executing
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

ACTIONS:
    restart     Stop and start containers (default)
    rebuild     Rebuild images and recreate containers
    stop        Stop running containers
    start       Start stopped containers
    down        Stop and remove containers, networks
    up          Create and start containers

EXAMPLES:
    # Restart all containers
    $(basename "$0")

    # Rebuild and restart only backend and frontend
    $(basename "$0") -a rebuild backend frontend

    # Pull latest images and restart with force recreate
    $(basename "$0") -p -r

    # Full rebuild with pruning (useful for CI)
    $(basename "$0") -a rebuild -b -p --prune

    # Include all services (including pgadmin)
    $(basename "$0") --all

NOTE:
    By default, pgadmin is excluded. Use --all to include it, or use
    the separate start-pgadmin.sh script to start it manually.

GITHUB ACTIONS USAGE:
    - name: Restart containers
      run: ./scripts/restart-containers.sh -a rebuild -b
      env:
        CI: true

EOF
    exit 0
}

#===============================================================================
# Argument Parsing
#===============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--action)
                ACTION="$2"
                shift 2
                ;;
            -b|--build)
                BUILD_FLAG="--build"
                shift
                ;;
            -f|--file)
                COMPOSE_FILE="$2"
                shift 2
                ;;
            -d|--dir)
                PROJECT_DIR="$2"
                shift 2
                ;;
            -p|--pull)
                PULL_FLAG="--pull always"
                shift
                ;;
            -r|--force-recreate)
                FORCE_RECREATE="--force-recreate"
                shift
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --prune)
                PRUNE_AFTER=true
                shift
                ;;
            --all)
                EXCLUDED_SERVICES=""
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            -*)
                log_error "Unknown option: $1"
                usage
                ;;
            *)
                SERVICES="$SERVICES $1"
                shift
                ;;
        esac
    done
}

#===============================================================================
# Validation
#===============================================================================

validate_environment() {
    gh_group_start "Validating environment"

    # Check for docker
    if ! command -v docker &> /dev/null; then
        gh_error "Docker is not installed or not in PATH"
        exit 1
    fi
    log_info "Docker version: $(docker --version)"

    # Check for docker compose
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        gh_error "Docker Compose is not installed"
        exit 1
    fi
    log_info "Docker Compose: $($COMPOSE_CMD version --short 2>/dev/null || $COMPOSE_CMD version)"

    # Change to project directory if specified
    if [[ -n "$PROJECT_DIR" ]]; then
        if [[ ! -d "$PROJECT_DIR" ]]; then
            gh_error "Project directory not found: $PROJECT_DIR"
            exit 1
        fi
        cd "$PROJECT_DIR"
        log_info "Working directory: $(pwd)"
    fi

    # Check for compose file
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        gh_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    log_info "Using compose file: $COMPOSE_FILE"

    # Validate action
    case $ACTION in
        restart|rebuild|stop|start|down|up)
            log_info "Action: $ACTION"
            ;;
        *)
            gh_error "Invalid action: $ACTION"
            exit 1
            ;;
    esac

    gh_group_end
}

#===============================================================================
# Docker Operations
#===============================================================================

run_cmd() {
    if [[ "$VERBOSE" == "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
        log_info "Executing: $*"
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi

    "$@"
}

get_container_status() {
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps --format json 2>/dev/null || \
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps
}

is_service_excluded() {
    local service=$1
    for excluded in $EXCLUDED_SERVICES; do
        if [[ "$service" == "$excluded" ]]; then
            return 0
        fi
    done
    return 1
}

should_skip_health_check() {
    local service=$1
    for skip in $SKIP_HEALTH_CHECK; do
        if [[ "$service" == "$skip" ]]; then
            return 0
        fi
    done
    return 1
}

get_services_to_run() {
    # If specific services were provided, use those (trim leading/trailing spaces)
    if [[ -n "$SERVICES" ]]; then
        echo "$SERVICES" | xargs
        return
    fi

    # Otherwise, get all services except excluded ones
    local all_services
    all_services=$($COMPOSE_CMD -f "$COMPOSE_FILE" config --services)

    local filtered_services=""
    for service in $all_services; do
        if ! is_service_excluded "$service"; then
            if [[ -z "$filtered_services" ]]; then
                filtered_services="$service"
            else
                filtered_services="$filtered_services $service"
            fi
        else
            log_info "Excluding service: $service (use --all to include)"
        fi
    done

    echo "$filtered_services"
}

wait_for_healthy() {
    local service=$1
    local max_attempts=$((TIMEOUT / 5))
    local attempt=0

    # Skip health check for certain services
    if should_skip_health_check "$service"; then
        log_info "Skipping health check for $service"
        return 0
    fi

    log_info "Waiting for $service to be healthy..."

    while [[ $attempt -lt $max_attempts ]]; do
        local status
        status=$($COMPOSE_CMD -f "$COMPOSE_FILE" ps "$service" --format "{{.Health}}" 2>/dev/null || echo "unknown")

        if [[ "$status" == "healthy" ]]; then
            log_success "$service is healthy"
            return 0
        fi

        ((attempt++))
        sleep 5
    done

    gh_warning "$service did not become healthy within ${TIMEOUT}s"
    return 1
}

do_stop() {
    gh_group_start "Stopping containers"
    log_info "Stopping containers..."

    local services_to_run
    services_to_run=$(get_services_to_run)

    run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" stop $services_to_run

    log_success "Containers stopped"
    gh_group_end
}

do_start() {
    gh_group_start "Starting containers"
    log_info "Starting containers..."

    local services_to_run
    services_to_run=$(get_services_to_run)

    run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" start $services_to_run

    log_success "Containers started"
    gh_group_end
}

do_down() {
    gh_group_start "Bringing down containers"
    log_info "Stopping and removing containers..."

    local services_to_run
    services_to_run=$(get_services_to_run)

    # Note: 'down' with specific services only stops those services
    if [[ -n "$services_to_run" ]]; then
        run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" stop $services_to_run
        run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" rm -f $services_to_run
    else
        run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" down $REMOVE_ORPHANS
    fi

    log_success "Containers removed"
    gh_group_end
}

do_up() {
    gh_group_start "Bringing up containers"
    log_info "Creating and starting containers..."

    local services_to_run
    services_to_run=$(get_services_to_run)

    local flags="$BUILD_FLAG $PULL_FLAG $FORCE_RECREATE $REMOVE_ORPHANS"
    run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" up -d $flags $services_to_run

    log_success "Containers started"
    gh_group_end
}

do_restart() {
    gh_group_start "Restarting containers"
    log_info "Restarting containers..."

    local services_to_run
    services_to_run=$(get_services_to_run)

    if [[ -n "$BUILD_FLAG" ]] || [[ -n "$FORCE_RECREATE" ]] || [[ -n "$PULL_FLAG" ]]; then
        # If any special flags, do down + up
        do_down
        do_up
    else
        # Simple restart
        run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" restart $services_to_run
    fi

    log_success "Containers restarted"
    gh_group_end
}

do_rebuild() {
    gh_group_start "Rebuilding containers"
    log_info "Rebuilding containers..."

    local services_to_run
    services_to_run=$(get_services_to_run)

    # Build images
    log_info "Building images..."
    run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache $services_to_run

    # Recreate containers
    log_info "Recreating containers..."
    run_cmd $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --force-recreate $REMOVE_ORPHANS $services_to_run

    log_success "Containers rebuilt"
    gh_group_end
}

do_prune() {
    gh_group_start "Pruning unused resources"
    log_info "Pruning unused Docker resources..."

    # Remove unused images
    run_cmd docker image prune -f

    # Remove unused volumes (be careful in production!)
    if [[ "${PRUNE_VOLUMES:-false}" == "true" ]]; then
        run_cmd docker volume prune -f
    fi

    # Remove unused networks
    run_cmd docker network prune -f

    log_success "Pruning complete"
    gh_group_end
}

show_status() {
    gh_group_start "Container Status"
    log_info "Current container status:"

    $COMPOSE_CMD -f "$COMPOSE_FILE" ps

    gh_group_end
}

run_health_checks() {
    gh_group_start "Health Checks"
    log_info "Running health checks..."

    local all_healthy=true
    local services_to_check

    services_to_check=$(get_services_to_run)

    for service in $services_to_check; do
        if ! wait_for_healthy "$service"; then
            all_healthy=false
        fi
    done

    if [[ "$all_healthy" == "true" ]]; then
        log_success "All services are healthy"
        gh_set_output "healthy" "true"
    else
        gh_warning "Some services are not healthy"
        gh_set_output "healthy" "false"
    fi

    gh_group_end
}

#===============================================================================
# Main
#===============================================================================

main() {
    parse_args "$@"
    validate_environment

    local start_time
    start_time=$(date +%s)

    # Execute the requested action
    case $ACTION in
        restart)
            do_restart
            ;;
        rebuild)
            do_rebuild
            ;;
        stop)
            do_stop
            ;;
        start)
            do_start
            ;;
        down)
            do_down
            ;;
        up)
            do_up
            ;;
    esac

    # Post-operation tasks
    if [[ "$PRUNE_AFTER" == "true" ]]; then
        do_prune
    fi

    # Show status and run health checks (skip for stop/down)
    if [[ "$ACTION" != "stop" ]] && [[ "$ACTION" != "down" ]]; then
        show_status
        run_health_checks
    fi

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Operation completed in ${duration}s"
    gh_set_output "duration" "$duration"
    gh_set_output "action" "$ACTION"
}

main "$@"
