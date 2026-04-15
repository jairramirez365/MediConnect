const levels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR'
};

function write(level, message, metadata = {}) {
  const payload = {
    level,
    message,
    ...metadata,
    timestamp: new Date().toISOString()
  };

  const line = JSON.stringify(payload);

  if (level === levels.error) {
    console.error(line);
    return;
  }

  console.log(line);
}

module.exports = {
  info: (message, metadata) => write(levels.info, message, metadata),
  warn: (message, metadata) => write(levels.warn, message, metadata),
  error: (message, metadata) => write(levels.error, message, metadata)
};
