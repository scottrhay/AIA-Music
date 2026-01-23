#!/bin/bash
# AIAMusic Backup Script
# Backs up database and audio files to a configurable destination

set -e

# ============================================
# CONFIGURATION - Edit these for your setup
# ============================================

# App configuration
APP_NAME="aiamusic"
APP_DIR="/opt/AIAMusic"
DATA_DIR="${APP_DIR}/data"
AUDIO_DIR="${DATA_DIR}/audio"

# Database configuration (from your .env or docker-compose)
DB_CONTAINER="mysql"          # Name of MySQL container
DB_NAME="sunoapp_db"
DB_USER="sunoapp_user"
DB_PASSWORD="${DB_PASSWORD:-}"  # Set via environment or edit here

# Backup configuration
BACKUP_DIR="/opt/backups/${APP_NAME}"
RETENTION_DAYS=30             # Keep backups for this many days
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${APP_NAME}_${DATE}"

# Remote backup (optional) - uncomment and configure if using
# REMOTE_BACKUP_ENABLED=true
# REMOTE_HOST="user@backup-server.com"
# REMOTE_PATH="/backups/aiamusic"

# ============================================
# FUNCTIONS
# ============================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
    exit 1
}

check_requirements() {
    log "Checking requirements..."

    if [ -z "$DB_PASSWORD" ]; then
        error "DB_PASSWORD not set. Export it or edit the script."
    fi

    if ! docker ps | grep -q "$DB_CONTAINER"; then
        error "MySQL container '$DB_CONTAINER' is not running"
    fi

    if [ ! -d "$AUDIO_DIR" ]; then
        log "Warning: Audio directory $AUDIO_DIR does not exist yet"
    fi
}

create_backup_dir() {
    log "Creating backup directory..."
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"
}

backup_database() {
    log "Backing up database '$DB_NAME'..."

    docker exec "$DB_CONTAINER" mysqldump \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"

    # Compress the SQL dump
    gzip "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"

    local size=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}/database.sql.gz" | cut -f1)
    log "Database backup complete: $size"
}

backup_audio_files() {
    log "Backing up audio files..."

    if [ -d "$AUDIO_DIR" ] && [ "$(ls -A $AUDIO_DIR 2>/dev/null)" ]; then
        tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/audio.tar.gz" \
            -C "$DATA_DIR" audio

        local size=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}/audio.tar.gz" | cut -f1)
        log "Audio backup complete: $size"
    else
        log "No audio files to backup"
        touch "${BACKUP_DIR}/${BACKUP_NAME}/audio_empty.marker"
    fi
}

backup_config() {
    log "Backing up configuration..."

    # Backup .env file (contains secrets - handle carefully!)
    if [ -f "${APP_DIR}/.env" ]; then
        cp "${APP_DIR}/.env" "${BACKUP_DIR}/${BACKUP_NAME}/env.backup"
        chmod 600 "${BACKUP_DIR}/${BACKUP_NAME}/env.backup"
    fi

    # Backup docker-compose file
    if [ -f "${APP_DIR}/docker-compose.yml" ]; then
        cp "${APP_DIR}/docker-compose.yml" "${BACKUP_DIR}/${BACKUP_NAME}/"
    fi
}

create_manifest() {
    log "Creating backup manifest..."

    cat > "${BACKUP_DIR}/${BACKUP_NAME}/manifest.json" << EOF
{
    "app_name": "${APP_NAME}",
    "backup_date": "$(date -Iseconds)",
    "backup_name": "${BACKUP_NAME}",
    "database_name": "${DB_NAME}",
    "files": {
        "database": "database.sql.gz",
        "audio": "audio.tar.gz",
        "config": "env.backup"
    },
    "hostname": "$(hostname)",
    "created_by": "backup.sh"
}
EOF
}

create_archive() {
    log "Creating final backup archive..."

    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"

    local size=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    log "Final archive created: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz ($size)"
}

sync_to_remote() {
    if [ "${REMOTE_BACKUP_ENABLED:-false}" = "true" ]; then
        log "Syncing to remote backup server..."

        rsync -avz --progress \
            "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
            "${REMOTE_HOST}:${REMOTE_PATH}/"

        log "Remote sync complete"
    fi
}

cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."

    local count=$(find "$BACKUP_DIR" -name "${APP_NAME}_*.tar.gz" -mtime +${RETENTION_DAYS} | wc -l)

    if [ "$count" -gt 0 ]; then
        find "$BACKUP_DIR" -name "${APP_NAME}_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
        log "Removed $count old backup(s)"
    else
        log "No old backups to remove"
    fi
}

show_summary() {
    log "=========================================="
    log "Backup completed successfully!"
    log "=========================================="
    log "Backup file: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    log "Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)"
    log ""
    log "To restore, run:"
    log "  ./restore.sh ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    log ""

    # Show current backups
    log "Current backups:"
    ls -lh "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | tail -5 || log "  (none)"
}

# ============================================
# MAIN
# ============================================

main() {
    log "Starting AIAMusic backup..."

    check_requirements
    create_backup_dir
    backup_database
    backup_audio_files
    backup_config
    create_manifest
    create_archive
    sync_to_remote
    cleanup_old_backups
    show_summary
}

# Run main function
main "$@"
