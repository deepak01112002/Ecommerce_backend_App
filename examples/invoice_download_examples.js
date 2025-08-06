// Invoice Download API Examples
// ============================

// 1. BASIC INVOICE DOWNLOAD FUNCTION
async function downloadInvoice(orderId, format = 'A4') {
    try {
        const userToken = localStorage.getItem('userToken'); // Get user auth token
        
        const response = await fetch(`/api/invoices/order/${orderId}/download?format=${format}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Convert response to blob for file download
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Invoice downloaded successfully');
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Download failed:', error.message);
            alert(`Download failed: ${error.message}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Download error:', error);
        alert('Failed to download invoice. Please try again.');
        return false;
    }
}

// 2. REACT COMPONENT EXAMPLE
const InvoiceDownloadButton = ({ orderId, orderNumber }) => {
    const [downloading, setDownloading] = useState(false);
    
    const handleDownload = async (format) => {
        setDownloading(true);
        
        try {
            const token = localStorage.getItem('userToken');
            
            const response = await fetch(`/api/invoices/order/${orderId}/download?format=${format}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Invoice-${orderNumber}.pdf`;
                link.click();
                URL.revokeObjectURL(url);
                
                // Show success message
                toast.success('Invoice downloaded successfully!');
            } else {
                const error = await response.json();
                toast.error(error.message || 'Download failed');
            }
        } catch (error) {
            toast.error('Failed to download invoice');
        } finally {
            setDownloading(false);
        }
    };
    
    return (
        <div className="invoice-download-buttons">
            <button 
                onClick={() => handleDownload('A4')}
                disabled={downloading}
                className="btn btn-primary"
            >
                {downloading ? 'Downloading...' : 'Download Invoice (A4)'}
            </button>
            
            <button 
                onClick={() => handleDownload('thermal')}
                disabled={downloading}
                className="btn btn-secondary"
            >
                {downloading ? 'Downloading...' : 'Download Receipt'}
            </button>
        </div>
    );
};

// 3. AXIOS IMPLEMENTATION
const downloadInvoiceWithAxios = async (orderId, format = 'A4') => {
    try {
        const token = localStorage.getItem('userToken');
        
        const response = await axios({
            method: 'GET',
            url: `/api/invoices/order/${orderId}/download`,
            params: { format },
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob' // Important for file download
        });
        
        // Create file download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true };
    } catch (error) {
        console.error('Download error:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || 'Download failed' 
        };
    }
};

// 4. CHECK DOWNLOAD AVAILABILITY FIRST
const checkAndDownloadInvoice = async (orderId) => {
    try {
        // First check if downloads are enabled
        const settingsResponse = await fetch('/api/settings/public/invoice-settings');
        const settings = await settingsResponse.json();
        
        if (!settings.data.invoiceSettings.downloadEnabled) {
            alert('Invoice downloads are currently disabled');
            return false;
        }
        
        // Check if invoice exists for this order
        const token = localStorage.getItem('userToken');
        const invoiceResponse = await fetch(`/api/invoices/order/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!invoiceResponse.ok) {
            alert('Invoice not found for this order');
            return false;
        }
        
        // Proceed with download
        return await downloadInvoice(orderId);
        
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

// 5. BULK DOWNLOAD MULTIPLE INVOICES
const downloadMultipleInvoices = async (orderIds) => {
    const results = [];
    
    for (const orderId of orderIds) {
        try {
            console.log(`Downloading invoice for order: ${orderId}`);
            const success = await downloadInvoice(orderId);
            results.push({ orderId, success });
            
            // Add delay between downloads to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            results.push({ orderId, success: false, error: error.message });
        }
    }
    
    return results;
};

// 6. VANILLA JAVASCRIPT IMPLEMENTATION
function downloadInvoiceVanilla(orderId, format = 'A4') {
    const token = localStorage.getItem('userToken');
    
    if (!token) {
        alert('Please login to download invoice');
        return;
    }
    
    // Create a temporary form for download
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = `/api/invoices/order/${orderId}/download?format=${format}`;
    form.style.display = 'none';
    
    // Add authorization header (Note: This won't work with form submission)
    // Better to use fetch API as shown in examples above
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

// 7. ERROR HANDLING EXAMPLE
const downloadInvoiceWithErrorHandling = async (orderId, format = 'A4') => {
    try {
        const token = localStorage.getItem('userToken');
        
        if (!token) {
            throw new Error('Authentication required. Please login.');
        }
        
        const response = await fetch(`/api/invoices/order/${orderId}/download?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Handle different error scenarios
        if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
            throw new Error('Invoice downloads are disabled or access denied.');
        } else if (response.status === 404) {
            throw new Error('Invoice not found for this order.');
        } else if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Download failed');
        }
        
        // Success - handle file download
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        
        return { success: true, message: 'Invoice downloaded successfully' };
        
    } catch (error) {
        console.error('Download error:', error);
        return { success: false, message: error.message };
    }
};

// 8. USAGE IN ORDER LISTING PAGE
const OrderRow = ({ order }) => {
    const handleInvoiceDownload = () => {
        downloadInvoice(order._id, 'A4');
    };
    
    return (
        <tr>
            <td>{order.orderNumber}</td>
            <td>{order.status}</td>
            <td>₹{order.total}</td>
            <td>
                <button 
                    onClick={handleInvoiceDownload}
                    className="btn btn-sm btn-outline-primary"
                    title="Download Invoice"
                >
                    📄 Invoice
                </button>
            </td>
        </tr>
    );
};

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        downloadInvoice,
        downloadInvoiceWithAxios,
        checkAndDownloadInvoice,
        downloadMultipleInvoices,
        downloadInvoiceWithErrorHandling
    };
}
