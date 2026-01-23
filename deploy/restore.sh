#!/bin/bash
# AIAMusic Restore Script
# Restores database and audio files from a backup archive

set -e

# ============================================
# CONFIGURATION
# ============================================

APP_NAME="aiamusic"
APP_DIR="/opt/AIAMusic"
DATA_DIR="${APP_DIR}/data"
AUDIO_DIR="${DATA_DIR}/audio"

# Database configuration
DB_CONTAINER="mysql"
DB_NAME="sunoapp_db"
DB_USER="sunoapp_user"
DB_PASSWORD="${DB_PASSWORD:-}"

# Temporary extraction directory
TEMP_DIR="/tmp/aiamusic_restore_$$"

# ============================================
# FUNCTIONS
# ============================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
    cleanup
    exit 1
}

cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

usage() {
    echo "Usage: $0 <backup_archive.tar.gz> [options]"
    echo ""
    echo "Options:"
    echo "  --db-only      Restore only the database"
    echo "  --audio-only   Restore only audio files"
    echo "  --config-only  Restore only configuration"
    echo "  --dry-run      Show what would be restored without doing it"
    echo "  --force        Skip confirmation prompts"
    echo ""
    echo "Examples:"
    echo "  $0 /opt/backups/aiamusic/aiamusic_20240115_120000.tar.gz"
    echo "  $0 backup.tar.gz --db-only"
    echo "  $0 backup.tar.gz --dry-run"
    exit 1
}

check_requirements() {
    log "Checking requirements..."

    if [ ! -f "$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_FILE"
    fi

    if [ -z "$DB_PASSWORD" ] && [ "$RESTORE_DB" = "true" ]; then
        error "DB_PASSWORD not set. Export it or edit the script."
    fi

    if ! docker ps | grep -q "$DB_CONTAINER" && [ "$RESTORE_DB" = "true" ]; then
        error "MySQL container '$DB_CONTAINER' is not running"
    fi
}

extract_backup() {
    log "Extracting backup archive..."

    mkdir -p "$TEMP_DIR"
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

    # Find the extracted directory (should be the backup name)
    EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "${APP_NAME}_*" | head -1)

    if [ -z "$EXTRACTED_DIR" ]; then
        # Maybe the contents are directly in TEMP_DIR
        if [ -f "$TEMP_DIR/manifest.json" ]; then
            EXTRACTED_DIR="$TEMP_DIR"
        else
            error "Could not find backup contents in archive"
        fi
    fi

    log "Extracted to: $EXTRACTED_DIR"

    # Show manifest if it exists
    if [ -f "$EXTRACTED_DIR/manifest.json" ]; then
        log "Backup manifest:"
        cat "$EXTRACTED_DIR/manifest.json" | head -20
        echo ""
    fi
}

confirm_restore() {
    if [ "$FORCE" = "true" ]; then
        return 0
    fi

    echo ""
    echo "=========================================="
    echo "WARNING: This will overwrite existing data!"
    echo "=========================================="
    echo ""
    echo "Restore targets:"
    [ "$RESTORE_DB" = "true" ] && echo "  - Database: $DB_NAME"
    [ "$RESTORE_AUDIO" = "true" ] && echo "  - Audio files: $AUDIO_DIR"
    [ "$RESTORE_CONFIG" = "true" ] && echo "  - Configuration: ${APP_DIR}/.env"
    echo ""

    if [ "$DRY_RUN" = "true" ]; then
        log "Dry run - no changes will be made"
        return 0
    fi

    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
}

stop_app() {
    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] Would stop $APP_NAME container"
        return 0
    fi

    log "Stopping $APP_NAME container..."

    cd "$APP_DIR"
    if docker ps | grep -q "$APP_NAME"; then
        docker compose stop "$APP_NAME" || true
    fi
}

start_app() {
    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] Would start $APP_NAME container"
        return 0
    fi

    log "Starting $APP_NAME container..."

    cd "$APP_DIR"
    docker compose up -d "$APP_NAME"
}

restore_database() {
    if [ "$RESTORE_DB" != "true" ]; then
        return 0
    fi

    local db_file="$EXTRACTED_DIR/database.sql.gz"

    if [ ! -f "$db_file" ]; then
        log "Warning: Database backup not found, skipping"
        return 0
    fi

    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] Would restore database from: $db_file"
        log "[DRY RUN] Size: $(du -h "$db_file" | cut -f1)"
        return 0
    fi

    log "Restoring database..."

    # Decompress and restore
    gunzip -c "$db_file" | docker exec -i "$DB_CONTAINER" mysql \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"

    log "Database restored successfully"
}

restore_audio() {
    if [ "$RESTORE_AUDIO" != "true" ]; then
        return 0
    fi

    local audio_file="$EXTRACTED_DIR/audio.tar.gz"

    if [ -f "$EXTRACTED_DIR/audio_empty.marker" ]; then
        log "Backup contains no audio files (empty marker found)"
        return 0
    fi

    if [ ! -f "$audio_file" ]; then
        log "Warning: Audio backup not found, skipping"
        return 0
    fi

    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] Would restore audio files from: $audio_file"
        log "[DRY RUN] Size: $(du -h "$audio_file" | cut -f1)"
        log "[DRY RUN] Target: $AUDIO_DIR"
        return 0
    fi

    log "Restoring audio files..."

    # Create data directory if it doesn't exist
    mkdir -p "$DATA_DIR"

    # Remove existing audio directory and restore from backup
    if [ -d "$AUDIO_DIR" ]; then
        log "Removing existing audio directory..."
        rm -rf "$AUDIO_DIR"
    fi

    # Extract audio files
    tar -xzf "$audio_file" -C "$DATA_DIR"

    # Fix permissions
    chown -R root:root "$AUDIO_DIR" 2>/dev/null || true

    local count=$(find "$AUDIO_DIR" -name "*.mp3" 2>/dev/null | wc -l)
    log "Audio files restored: $count files"
}

restore_config() {
    if [ "$RESTORE_CONFIG" != "true" ]; then
        return 0
    fi

    local env_file="$EXTRACTED_DIR/env.backup"

    if [ ! -f "$env_file" ]; then
        log "Warning: Config backup not found, skipping"
        return 0
    fi

    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] Would restore config to: ${APP_DIR}/.env"
        return 0
    fi

    log "Restoring configuration..."

    # Backup current .env if it exists
    if [ -f "${APP_DIR}/.env" ]; then
        cp "${APP_DIR}/.env" "${APP_DIR}/.env.pre-restore"
        log "Current .env backed up to .env.pre-restore"
    fi

    cp "$env_file" "${APP_DIR}/.env"
    chmod 600 "${APP_DIR}/.env"

    log "Configuration restored"
}

show_summary() {
    echo ""
    log "=========================================="
    log "Restore completed successfully!"
    log "=========================================="
    echo ""

    if [ "$RESTORE_DB" = "true" ]; then
        log "Database '$DB_NAME' restored"
    fi

    if [ "$RESTORE_AUDIO" = "true" ]; then
        local count=$(find "$AUDIO_DIR" -name "*.mp3" 2>/dev/null | wc -l)
        log "Audio files restored: $count files"
    fi

    if [ "$RESTORE_CONFIG" = "true" ]; then
        log "Configuration restored to ${APP_DIR}/.env"
    fi

    echo ""
    log "Verify the app is working:"
    log "  curl -s https://music.aiacopilot.com/health"
    log "  docker compose logs -f $APP_NAME"
}

# ============================================
# PARSE ARGUMENTS
# ============================================

BACKUP_FILE=""
RESTORE_DB="true"
RESTORE_AUDIO="true"
RESTORE_CONFIG="true"
DRY_RUN="false"
FORCE="false"

while [ $# -gt 0 ]; do
    case "$1" in
        --db-only)
            RESTORE_AUDIO="false"
            RESTORE_CONFIG="false"
            shift
            ;;
        --audio-only)
            RESTORE_DB="false"
            RESTORE_CONFIG="false"
            shift
            ;;
        --config-only)
            RESTORE_DB="false"
            RESTORE_AUDIO="false"
            shift
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --force)
            FORCE="true"
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$1"
            else
                error "Unknown option: $1"
            fi
            shift
            ;;
    esac
done

if [ -z "$BACKUP_FILE" ]; then
    usage
fi

# ============================================
# MAIN
# ============================================

main() {
    log "Starting AIAMusic restore..."
    log "Backup file: $BACKUP_FILE"

    check_requirements
    extract_backup
    confirm_restore

    if [ "$DRY_RUN" != "true" ]; then
        stop_app
    fi

    restore_database
    restore_audio
    restore_config

    if [ "$DRY_RUN" != "true" ]; then
        start_app
    fi

    cleanup

    if [ "$DRY_RUN" = "true" ]; then
        log "Dry run completed - no changes were made"
    else
        show_summary
    fi
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main
