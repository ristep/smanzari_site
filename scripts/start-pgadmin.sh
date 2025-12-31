#!/bin/bash

#===============================================================================
# start-pgadmin.sh
# Script for manually starting/stopping pgAdmin container
#===============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ACTION="start"
COMPOSE_FILE="docker-compose.yml"
PROJECT_DIR=""

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

usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS] [ACTION]

Script for manually starting/stopping pgAdmin container.

ACTIONS:
    start       Start pgAdmin container (default)
    stop        Stop pgAdmin container
    restart     Restart pgAdmin container
    status      Show pgAdmin container status
    logs        Show pgAdmin container logs

OPTIONS:
    -f, --file FILE     Specify docker-compose file (default: docker-compose.yml)
    -d, --dir DIR       Project directory containing docker-compose.yml
    -h, --help          Show this help message

EXAMPLES:
    # Start pgAdmin
    $(basename "$0")

    # Stop pgAdmin
    $(basename "$0") stop

    # View logs
    $(basename "$0") logs

    # Check status
    $(basename "$0") status

EOF
    exit 0
}

#===============================================================================
# Argument Parsing
#===============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--file)
                COMPOSE_FILE="$2"
                shift 2
                ;;
            -d|--dir)
                PROJECT_DIR="$2"
                shift 2
                ;;
            -h|--help)
                usage
                ;;
            start|stop|restart|status|logs)
                ACTION="$1"
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                usage
                ;;
            *)
                log_error "Unknown argument: $1"
                usage
                ;;
        esac
    done
}

#===============================================================================
# Validation
#===============================================================================

validate_environment() {
    # Check for docker compose
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        log_error "Docker Compose is not installed"
        exit 1
    fi

    # Change to project directory if specified
    if [[ -n "$PROJECT_DIR" ]]; then
        if [[ ! -d "$PROJECT_DIR" ]]; then
            log_error "Project directory not found: $PROJECT_DIR"
            exit 1
        fi
        cd "$PROJECT_DIR"
    fi

    # Check for compose file
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
}

#===============================================================================
# Actions
#===============================================================================

do_start() {
    log_info "Starting pgAdmin..."

    # Check if postgres is running (pgadmin depends on it)
    if ! $COMPOSE_CMD -f "$COMPOSE_FILE" ps postgres --status running &> /dev/null; then
        log_warn "PostgreSQL doesn't appear to be running. pgAdmin may not work properly."
    fi

    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d pgadmin

    log_success "pgAdmin started!"
    log_info "Access pgAdmin at: http://localhost:5050"
}

do_stop() {
    log_info "Stopping pgAdmin..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" stop pgadmin
    log_success "pgAdmin stopped"
}

do_restart() {
    log_info "Restarting pgAdmin..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" restart pgadmin
    log_success "pgAdmin restarted"
    log_info "Access pgAdmin at: http://localhost:5050"
}

do_status() {
    log_info "pgAdmin container status:"
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps pgadmin
}

do_logs() {
    log_info "pgAdmin logs (Ctrl+C to exit):"
    $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f pgadmin
}

#===============================================================================
# Main
#===============================================================================

main() {
    parse_args "$@"
    validate_environment

    case $ACTION in
        start)
            do_start
            ;;
        stop)
            do_stop
            ;;
        restart)
            do_restart
            ;;
        status)
            do_status
            ;;
        logs)
            do_logs
            ;;
    esac
}

main "$@"
