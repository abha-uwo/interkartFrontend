const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById('configForm');
    const copyBtn = document.getElementById('copyBtn');
    const webhookUrl = document.getElementById('webhookUrl');
    const alertMessage = document.getElementById('alertMessage');

    // Set webhook URL dynamically from BASE_URL
    webhookUrl.value = `${BASE_URL}/webhook/interakt`;

    // Handle Copy Webhook URL
    copyBtn.addEventListener('click', () => {
        webhookUrl.select();
        webhookUrl.setSelectionRange(0, 99999); // For mobile devices
        
        navigator.clipboard.writeText(webhookUrl.value)
            .then(() => {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                copyBtn.style.color = 'var(--success)';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.style.color = 'var(--text-muted)';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    });

    // Handle Form Submission
    configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const apiKey = document.getElementById('apiKey').value;
        const submitBtn = configForm.querySelector('button[type="submit"]');
        
        // UI Feedback
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        try {
            // Mock API call to save config
            const response = await fetch(`${BASE_URL}/api/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Configuration saved successfully!', 'success');
            } else {
                showAlert('Failed to save configuration.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('An error occurred. Please try again.', 'error');
        } finally {
            submitBtn.textContent = 'Save Configuration';
            submitBtn.disabled = false;
        }
    });

    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = `alert ${type}`;
        alertMessage.classList.remove('hidden');
        
        setTimeout(() => {
            alertMessage.classList.add('hidden');
        }, 3000);
    }
});
