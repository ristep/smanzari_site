#!/bin/bash

SESSION="smanzy_dev"
# Note: kept "Develpment" (missing 'o') as requested. 
# Change to "Development" if that was a typo on your machine.
PROJECT_DIR="~/Development/smanzari_site"

# 1. Check if session exists
tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
    # --- PANE 0: Main Terminal (Left Side, Full Height) ---
    tmux new-session -d -s $SESSION -n "DevStack"
    # Set up the main working directory
    tmux send-keys -t $SESSION "cd $PROJECT_DIR" C-m
    tmux send-keys -t $SESSION "clear" C-m

    # --- PANE 1: Database (Right Side, Top) ---
    tmux split-window -t $SESSION
    # We cd into project dir first, then into backend to be safe
    tmux send-keys -t $SESSION "cd $PROJECT_DIR/smanzy_backend" C-m
    tmux send-keys -t $SESSION "docker compose up" C-m

    # --- PANE 2: Backend API (Right Side, Middle) ---
    tmux split-window -t $SESSION
    tmux send-keys -t $SESSION "cd $PROJECT_DIR/smanzy_backend" C-m
    tmux send-keys -t $SESSION "make dev" C-m

    # --- PANE 3: Front-end (Right Side, Bottom) ---
    tmux split-window -t $SESSION
    tmux send-keys -t $SESSION "cd $PROJECT_DIR/smanzy_react_spa" C-m
    tmux send-keys -t $SESSION "vite dev" C-m

    # --- LAYOUT: Main Vertical ---
    # This puts Pane 0 (Terminal) as the large main window on the left
    # and stacks Panes 1, 2, and 3 vertically on the right.
    tmux select-layout -t $SESSION main-vertical
    
    # Optional: Return focus to the main terminal (Pane 0)
    tmux select-pane -t $SESSION:0.0
fi

# 2. Attach
tmux attach-session -t $SESSION