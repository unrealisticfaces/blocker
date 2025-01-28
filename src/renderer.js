window.electronAPI.onBlockedExecution((event, value) => {
    const notificationsDiv = document.getElementById('notifications');
    const notification = document.createElement('p');
    notification.textContent = `Blocked: ${value}`;
    notificationsDiv.appendChild(notification);
});