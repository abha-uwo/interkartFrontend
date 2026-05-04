const BASE_URL = 'https://wabot-b.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const clientId = localStorage.getItem('clientId');
    const clientName = localStorage.getItem('clientName');

    if (!clientId) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('sidebarClientName').textContent = clientName;
    document.getElementById('welcomeText').textContent = `Overview`;
    document.getElementById('webhookUrl').value = `${window.location.origin}/webhook/interakt/${clientId}`;

    const whatsappInput = document.getElementById('whatsappNumber');
    const interaktInput = document.getElementById('interaktKey');
    const docList = document.getElementById('docList');
    const fileInput = document.getElementById('fileInput');
    const botStatusDisplay = document.getElementById('botStatusDisplay');
    const pageDescription = document.getElementById('pageDescription');
    const welcomeText = document.getElementById('welcomeText');
    
    // Views
    const views = {
        overview: document.getElementById('view-overview'),
        whatsapp: document.getElementById('view-whatsapp'),
        knowledge: document.getElementById('view-knowledge'),
        golive: document.getElementById('view-golive'),
        profile: document.getElementById('view-profile'),
        support: document.getElementById('view-support')
    };
    
    const navs = {
        overview: document.getElementById('nav-overview'),
        whatsapp: document.getElementById('nav-whatsapp'),
        knowledge: document.getElementById('nav-knowledge'),
        golive: document.getElementById('nav-golive'),
        profile: document.getElementById('nav-profile'),
        support: document.getElementById('nav-support')
    };

    window.showView = (viewName) => {
        Object.keys(views).forEach(v => views[v].classList.add('hidden'));
        Object.keys(navs).forEach(n => navs[n] && navs[n].classList.remove('active'));
        
        views[viewName].classList.remove('hidden');
        if (navs[viewName]) navs[viewName].classList.add('active');

        if (viewName === 'overview') {
            welcomeText.textContent = "Dashboard Overview";
            pageDescription.textContent = "Monitor your bot performance and status.";
        } else if (viewName === 'whatsapp') {
            welcomeText.textContent = "WhatsApp Setup";
            pageDescription.textContent = "Configure your phone number and API keys.";
        } else if (viewName === 'knowledge') {
            welcomeText.textContent = "Knowledge Base";
            pageDescription.textContent = "Manage training documents for your AI.";
        } else if (viewName === 'golive') {
            welcomeText.textContent = "Go Live";
            pageDescription.textContent = "Activate your bot and start automating.";
        } else if (viewName === 'profile') {
            welcomeText.textContent = "Profile Settings";
            pageDescription.textContent = "Manage your business profile and account.";
        } else if (viewName === 'support') {
            welcomeText.textContent = "Customer Support";
            pageDescription.textContent = "Chat directly with the platform administrators.";
            loadSupportMessages();
        }
    };

    // Support System
    async function loadSupportMessages() {
        try {
            const res = await fetch(`${BASE_URL}/api/client/${clientId}/support`);
            const data = await res.json();
            renderSupportMessages(data.messages || []);
        } catch (err) { console.error('Error loading support:', err); }
    }

    function renderSupportMessages(messages) {
        const container = document.getElementById('supportChatMessages');
        if (messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.875rem;">No messages yet. Send a message to start.</p>';
            return;
        }
        container.innerHTML = messages.map(m => `
            <div style="align-self: ${m.sender === 'client' ? 'flex-end' : 'flex-start'}; max-width: 80%; padding: 12px 16px; border-radius: 16px; background: ${m.sender === 'client' ? 'var(--primary)' : '#ffffff'}; color: ${m.sender === 'client' ? '#ffffff' : 'var(--text-main)'}; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: ${m.sender === 'admin' ? '1px solid var(--border)' : 'none'};">
                <div style="font-size: 0.9375rem;">${m.text}</div>
                <div style="font-size: 0.7rem; margin-top: 4px; opacity: 0.7; text-align: right;">${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    }

    document.getElementById('supportForm').onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('supportInput');
        const message = input.value.trim();
        if (!message) return;

        try {
            const res = await fetch(`${BASE_URL}/api/support/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, clientName, message })
            });
            if (res.ok) {
                input.value = '';
                loadSupportMessages();
            }
        } catch (err) { console.error('Error sending message:', err); }
    };

    // Refresh support messages every 10 seconds if on support view
    setInterval(() => {
        if (!views.support.classList.contains('hidden')) {
            loadSupportMessages();
        }
    }, 10000);

    async function loadClientData() {
        try {
            const response = await fetch(`${BASE_URL}/api/client/${clientId}`);
            const data = await response.json();

            whatsappInput.value = data.whatsappNumber || '';
            interaktInput.value = data.apiKey || '';
            document.getElementById('profileDisplayName').value = data.name;
            
            updateLogos(data.logoUrl);
            renderDocs(data.documents || []);
            updateOverview(data);
            updateGoLive(data);
            updateStatusBadge(data);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    function updateLogos(url) {
        const sidebarImg = document.getElementById('sidebarLogoImg');
        const sidebarIcon = document.getElementById('sidebarDefaultIcon');
        const profileImg = document.getElementById('profileLogoImg');
        const profileIcon = document.querySelector('#profileLogoPreview svg');

        if (url) {
            const fullUrl = `${url}?t=${new Date().getTime()}`; // Prevent cache
            sidebarImg.src = fullUrl;
            sidebarImg.classList.remove('hidden');
            sidebarIcon.classList.add('hidden');
            
            profileImg.src = fullUrl;
            profileImg.classList.remove('hidden');
            profileIcon.classList.add('hidden');
        }
    }

    document.getElementById('logoInput').onchange = async (e) => {
        if (!e.target.files[0]) return;
        const formData = new FormData();
        formData.append('logo', e.target.files[0]);

        const res = await fetch(`${BASE_URL}/api/client/${clientId}/upload-logo`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            updateLogos(data.logoUrl);
            alert('Logo updated!');
        }
    };

    document.getElementById('profileUpdateForm').onsubmit = async (e) => {
        e.preventDefault();
        const newName = document.getElementById('profileDisplayName').value;
        const res = await fetch(`${BASE_URL}/api/client/${clientId}/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        if (res.ok) {
            localStorage.setItem('clientName', newName);
            document.getElementById('sidebarClientName').textContent = newName;
            alert('Profile updated!');
            loadClientData();
        }
    };

    window.deleteWhatsApp = async () => {
        if (!confirm('Are you sure you want to remove your WhatsApp integration? This will stop the bot.')) return;
        const res = await fetch(`${BASE_URL}/api/client/${clientId}/delete-whatsapp`, { method: 'POST' });
        if (res.ok) {
            alert('WhatsApp integration removed.');
            loadClientData();
        }
    };

    window.deactivateAccount = async () => {
        if (!confirm('WARNING: This will permanently deactivate your account and log you out. Continue?')) return;
        const res = await fetch(`${BASE_URL}/api/client/${clientId}/deactivate`, { method: 'POST' });
        if (res.ok) {
            alert('Account deactivated.');
            logout();
        }
    };

    function updateStatusBadge(data) {
        const isLive = data.botEnabled && data.whatsappNumber && data.apiKey;
        botStatusDisplay.innerHTML = `
            <div class="badge ${isLive ? 'badge-approved' : 'badge-pending'}">
                <span class="dot" style="background: currentColor"></span>
                Bot: ${isLive ? 'LIVE' : 'OFFLINE'}
            </div>
        `;
    }

    function updateOverview(data) {
        const isLive = data.botEnabled && data.whatsappNumber && data.apiKey;
        document.getElementById('overviewStatusText').textContent = isLive ? 'Connected' : 'Disconnected';
        document.getElementById('overviewStatusText').style.color = isLive ? 'var(--success)' : 'var(--danger)';
        document.getElementById('overviewPhoneText').textContent = data.whatsappNumber || 'None';
        document.getElementById('overviewDocsText').textContent = `${data.documents.length} Files`;

        const indicator = document.getElementById('liveIndicatorBig');
        indicator.style.background = isLive ? 'var(--success)' : '#e2e8f0';
        document.getElementById('statusTitleBig').textContent = isLive ? 'Bot is Live' : 'Bot is Offline';
        document.getElementById('statusDescBig').textContent = isLive 
            ? `Bot is actively responding to messages on ${data.whatsappNumber}.` 
            : 'Configure your WhatsApp number and enable "Go Live" to start responding to customers.';
    }

    function updateGoLive(data) {
        const checklist = document.getElementById('checklistItems');
        const items = [
            { label: 'Admin Approval', done: data.status === 'approved' },
            { label: 'WhatsApp Number Added', done: !!data.whatsappNumber },
            { label: 'Interakt API Key Added', done: !!data.apiKey },
            { label: 'Knowledge Base Ready', done: data.documents.length > 0 }
        ];

        checklist.innerHTML = items.map(item => `
            <div style="display: flex; align-items: center; gap: 10px; font-weight: 500;">
                <div style="width: 20px; height: 20px; border-radius: 50%; background: ${item.done ? 'var(--success)' : '#f1f5f9'}; display: flex; align-items: center; justify-content: center; color: white;">
                    ${item.done ? '✓' : ''}
                </div>
                <span style="color: ${item.done ? 'var(--text-main)' : 'var(--text-muted)'}">${item.label}</span>
            </div>
        `).join('');

        const toggleBtn = document.getElementById('toggleBotBtn');
        const allDone = items.every(i => i.done);

        if (data.botEnabled) {
            toggleBtn.textContent = "Deactivate Bot";
            toggleBtn.className = "btn btn-outline";
            toggleBtn.style.color = "var(--danger)";
            toggleBtn.style.borderColor = "var(--danger)";
        } else {
            toggleBtn.textContent = "Go Live Now";
            toggleBtn.className = allDone ? "btn btn-primary" : "btn btn-outline";
            toggleBtn.style.opacity = allDone ? "1" : "0.5";
        }

        toggleBtn.onclick = async () => {
            const newState = !data.botEnabled;
            const res = await fetch(`${BASE_URL}/api/client/${clientId}/toggle-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newState })
            });
            const result = await res.json();
            if (res.ok) {
                loadClientData();
            } else {
                alert(result.error);
            }
        };
    }

    function renderDocs(docs) {
        if (docs.length === 0) {
            docList.innerHTML = '<p style="color: var(--text-muted)">No files uploaded.</p>';
            return;
        }
        docList.innerHTML = docs.map(doc => `
            <div class="doc-item">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <a href="/api/client/${clientId}/documents/${doc}" target="_blank" style="font-size: 0.875rem; font-weight: 600; color: var(--text-main); text-decoration: none; cursor: pointer; border-bottom: 1px solid transparent;" onmouseover="this.style.borderBottom='1px solid var(--primary)'" onmouseout="this.style.borderBottom='1px solid transparent'">${doc}</a>
                </div>
                <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: transparent;" onclick="deleteDoc('${doc}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `).join('');
    }

    document.getElementById('botConfigForm').onsubmit = async (e) => {
        e.preventDefault();
        const res = await fetch(`${BASE_URL}/api/client/${clientId}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                whatsappNumber: whatsappInput.value,
                apiKey: interaktInput.value
            })
        });
        if (res.ok) {
            alert('Settings saved!');
            loadClientData();
        }
    };

    fileInput.onchange = async () => {
        if (!fileInput.files[0]) return;
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        try {
            const res = await fetch(`${BASE_URL}/api/client/${clientId}/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            
            if (res.ok) {
                fileInput.value = '';
                alert('Document uploaded and indexed successfully!');
                loadClientData();
            } else {
                alert('Upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error connecting to server. Please make sure the backend is running.');
        }
    };

    window.deleteDoc = async (filename) => {
        if (!confirm(`Delete ${filename}?`)) return;
        const res = await fetch(`${BASE_URL}/api/client/${clientId}/documents/${filename}`, { method: 'DELETE' });
        if (res.ok) loadClientData();
    };

    document.getElementById('copyWebhook').onclick = () => {
        const copyText = document.getElementById('webhookUrl');
        copyText.select();
        document.execCommand('copy');
        alert('Copied!');
    };

    window.logout = () => {
        localStorage.clear();
        window.location.href = 'login.html';
    };

    loadClientData();
});
