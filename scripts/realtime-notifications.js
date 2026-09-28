/**
 * Realtime Notifications Handler
 * Manages polling, badge updates, and visual/audio alerts for new notifications
 */

(function() {
  let pollingInterval = null;
  let lastNotificationCheckTime = 0;
  let previousUnreadCount = 0;

  // Get current user email safely
  function getCurrentUserEmail() {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      return user.email || null;
    } catch {
      return null;
    }
  }

  // Get auth token
  function getAuthToken() {
    return localStorage.getItem("userToken");
  }

  // Fetch unread notification count with proper headers
  async function fetchUnreadNotificationCount() {
    const email = getCurrentUserEmail();
    const token = getAuthToken();
    
    if (!email || !token) return 0;

    try {
      const response = await fetch(`/api/notifications/unread-count?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-user-email": email
        }
      });

      if (!response.ok) {
        console.warn("[Notifications] Failed to fetch unread count:", response.status);
        return previousUnreadCount;
      }

      const data = await response.json();
      return data.total || 0;
    } catch (error) {
      console.error("[Notifications] Error fetching unread count:", error);
      return previousUnreadCount;
    }
  }

  // Play notification sound
  function playNotificationSound() {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log("[Notifications] Could not play sound:", err.message);
    }
  }

  // Show browser notification
  function showBrowserNotification(title, options = {}) {
    if (!("Notification" in window)) {
      console.log("[Notifications] Browser notifications not supported");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/assets/SenpaiWorks logo.png",
        badge: "/assets/SenpaiWorks logo.png",
        ...options
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            icon: "/assets/SenpaiWorks logo.png",
            badge: "/assets/SenpaiWorks logo.png",
            ...options
          });
        }
      });
    }
  }

  // Update badge in header and trigger alerts if new notifications
  async function checkAndUpdateNotifications() {
    const currentCount = await fetchUnreadNotificationCount();
    
    console.log(`[Notifications] Unread count: ${currentCount} (previous: ${previousUnreadCount})`);

    // If new notifications arrived
    if (currentCount > previousUnreadCount) {
      const newCount = currentCount - previousUnreadCount;
      console.log(`[Notifications] New notifications: ${newCount}`);
      
      // Play sound
      playNotificationSound();
      
      // Show browser notification
      showBrowserNotification("SenpaiWorks", {
        body: `You have ${newCount} new notification${newCount > 1 ? "s" : ""}`,
        tag: "senpaiworks-notification"
      });
      
      // Refresh dropdown if it's open
      if (document.getElementById("notifications-dropdown")?.style.display === "block") {
        if (typeof window.loadDropdownNotifications === "function") {
          window.loadDropdownNotifications();
        }
      }
    }

    previousUnreadCount = currentCount;
    lastNotificationCheckTime = Date.now();
  }

  // Start polling for new notifications
  function startPolling(intervalMs = 10000) {
    if (pollingInterval) clearInterval(pollingInterval);

    console.log(`[Notifications] Starting polling every ${intervalMs}ms`);
    
    // Initial check
    checkAndUpdateNotifications();

    // Poll at specified interval
    pollingInterval = setInterval(() => {
      const email = getCurrentUserEmail();
      const token = getAuthToken();
      
      if (email && token) {
        checkAndUpdateNotifications();
      } else {
        console.log("[Notifications] User not logged in, stopping polls");
        stopPolling();
      }
    }, intervalMs);
  }

  // Stop polling
  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      console.log("[Notifications] Polling stopped");
    }
  }

  // Request browser notification permission on page load
  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  // Expose functions globally
  window.NotificationCenter = {
    start: () => startPolling(10000), // 10 seconds for realtime feel
    stop: stopPolling,
    check: checkAndUpdateNotifications,
    requestPermission: requestNotificationPermission
  };

  // Auto-start when DOM is ready and user is logged in
  document.addEventListener("DOMContentLoaded", () => {
    const email = getCurrentUserEmail();
    const token = getAuthToken();
    
    if (email && token) {
      console.log("[Notifications] User logged in, starting notification center");
      requestNotificationPermission();
      startPolling(10000); // Check every 10 seconds for more realtime feel
    }
  });

  // Start polling on page visibility change (user comes back to tab)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      console.log("[Notifications] Page hidden, reducing polling frequency");
      // Keep polling but less frequently
      startPolling(30000);
    } else {
      console.log("[Notifications] Page visible, increasing polling frequency");
      startPolling(10000);
    }
  });

  // Stop polling when user logs out
  window.addEventListener("storage", (e) => {
    if (e.key === "isLoggedIn" && e.newValue === "false") {
      console.log("[Notifications] User logged out, stopping polls");
      stopPolling();
    }
  });

  console.log("[Notifications] Realtime notification handler loaded");
})();
