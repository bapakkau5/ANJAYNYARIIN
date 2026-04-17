(async function() {
    const CONFIG = {
        turnstileSiteKey: '0x4AAAAAAC-yQLvq8Dniy2h1', 
        discordWebhook: 'https://blue-cloud-c20f.zhasktopia.workers.dev/log', 
        rateLimit: {
            maxRequests: 30,      
            timeWindow: 60000     
        },
        blockedUserAgents: ['python', 'curl', 'wget', 'go-http', 'java', 'perl', 'ruby', 'php', 'scrapy', 'nmap', 'masscan', 'zgrab', 'nikto', 'sqlmap', 'hydra'],
        blockedReferers: ['semalt.com', 'buttons-for-website.com', 'kambing.vlsm.org'],
        allowedCountries: ['ID', 'US', 'SG'] 
    };

    async function sendLog(data) {
        try {
            await fetch(CONFIG.discordWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch(e) { console.warn('Log gagal:', e); }
    }

    const ua = navigator.userAgent.toLowerCase();
    if (CONFIG.blockedUserAgents.some(bad => ua.includes(bad))) {
        document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:20vh">Access Denied (UA Block)</h1>';
        sendLog({ type: 'blocked_ua', ua: ua, url: location.href, timestamp: new Date().toISOString() });
        return;
    }

    const isHeadless = !navigator.webdriver === false || 
                       !navigator.languages || 
                       navigator.plugins.length === 0 ||
                       /headless/i.test(ua);
    if (isHeadless) {
        document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:20vh">Bot Detected - Access Denied</h1>';
        sendLog({ type: 'headless_bot', ua: ua, url: location.href });
        return;
    }

    const referer = document.referrer.toLowerCase();
    if (CONFIG.blockedReferers.some(spam => referer.includes(spam))) {
        sendLog({ type: 'spam_referer', referer: referer, url: location.href });

      location.href = 'https://www.google.com';
        return;
    }

    const storageKey = 'rl_' + location.hostname;
    let rateData = JSON.parse(sessionStorage.getItem(storageKey) || '{"count":0, "reset":0}');
    const now = Date.now();
    if (now > rateData.reset) {
        rateData = { count: 1, reset: now + CONFIG.rateLimit.timeWindow };
    } else {
        rateData.count++;
    }
    sessionStorage.setItem(storageKey, JSON.stringify(rateData));
    if (rateData.count > CONFIG.rateLimit.maxRequests) {
        alert('Terlalu banyak permintaan. Tunggu 1 menit.');
        sendLog({ type: 'rate_limit_exceeded', count: rateData.count, url: location.href });
        return;
    }

    const turnstileScript = document.createElement('script');
    turnstileScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    turnstileScript.async = true;
    turnstileScript.defer = true;
    document.head.appendChild(turnstileScript);

    const captchaDiv = document.createElement('div');
    captchaDiv.className = 'cf-turnstile';
    captchaDiv.setAttribute('data-sitekey', CONFIG.turnstileSiteKey);
    captchaDiv.setAttribute('data-theme', 'light');
    captchaDiv.setAttribute('data-size', 'normal');
    captchaDiv.style.position = 'fixed';
    captchaDiv.style.bottom = '20px';
    captchaDiv.style.right = '20px';
    captchaDiv.style.zIndex = '99999';
    captchaDiv.style.backgroundColor = 'rgba(0,0,0,0.6)';
    captchaDiv.style.padding = '8px';
    captchaDiv.style.borderRadius = '12px';
    captchaDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    document.body.appendChild(captchaDiv);

    let fp = sessionStorage.getItem('fp');
    if (!fp) {
        fp = btoa(navigator.userAgent + navigator.language + screen.width + screen.height + new Date().getTimezoneOffset());
        sessionStorage.setItem('fp', fp);
    } else {
        const newFp = btoa(navigator.userAgent + navigator.language + screen.width + screen.height + new Date().getTimezoneOffset());
        if (fp !== newFp) {
            sendLog({ type: 'fp_mismatch', old: fp, new: newFp, url: location.href });
        }
    }

    console.log('Mpan HUB');
})();
