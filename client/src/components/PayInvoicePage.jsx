import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PayInvoicePage = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                // Fetch invoice details without an auth token as the endpoint is now public
                const res = await axios.get(`/api/invoices/${invoiceId}`);
                setInvoice(res.data);
            } catch (err) {
                console.error('Error fetching invoice:', err);
                setError(err.response?.data?.msg || 'Failed to fetch invoice details. Please ensure the invoice ID is correct and try again.');
            }
            setLoading(false);
        };

        fetchInvoice();
    }, [invoiceId, navigate]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const displayRazorpay = async () => {
        setPaymentLoading(true);
        setError('');

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setError('Razorpay SDK failed to load. Are you online?');
            setPaymentLoading(false);
            return;
        }

        if (!invoice || !invoice.totalAmount) {
            setError('Invoice details are not loaded or amount is missing.');
            setPaymentLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const orderConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token, // Assuming your order creation endpoint is protected
                },
            };
            // 1. Create Order
            const { data: order } = await axios.post(
                '/api/razorpay/orders',
                { 
                    amount: invoice.totalAmount,
                    currency: 'INR', // Or get from invoice if available
                    receipt: `receipt_invoice_${invoice._id}`
                },
                orderConfig
            );

            if (!order || !order.id) {
                throw new Error('Failed to create Razorpay order.');
            }

            const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
            if (!razorpayKeyId) {
                setError('Razorpay Key ID is not configured in the client application.');
                setPaymentLoading(false);
                return;
            }

            const options = {
                key: razorpayKeyId,
                amount: order.amount, 
                currency: order.currency,
                name: invoice.companyName || 'Your Company Name',
                description: `Payment for Invoice ${invoice.invoiceNumber}`,
                order_id: order.id,
                handler: async function (response) {
                    // 2. Verify Payment
                    try {
                        const verifyConfig = {
                            headers: {
                                'Content-Type': 'application/json',
                                'x-auth-token': token, // Assuming your verify endpoint is protected
                            },
                        };
                        await axios.post(
                            '/api/razorpay/verify',
                            {
                                order_id: response.razorpay_order_id,
                                payment_id: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                            },
                            verifyConfig
                        );
                        alert('Payment successful!');
                        // Optionally, update invoice status locally or refetch
                        // navigate to a success page or back to invoices list
                        navigate('/invoices'); // Example navigation
                    } catch (verifyError) {
                        console.error('Payment verification failed:', verifyError);
                        setError(verifyError.response?.data?.message || 'Payment verification failed. Please contact support.');
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: invoice.clientName,
                    email: invoice.clientEmail,
                    // contact: '' // Optional: client phone number
                },
                notes: {
                    invoice_id: invoice._id,
                    client_name: invoice.clientName,
                },
                theme: {
                    color: '#3399cc'
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', function (response) {
                console.error('Razorpay payment failed:', response.error);
                setError(`Payment Failed: ${response.error.description} (Reason: ${response.error.reason})`);
                alert(`Payment Failed: ${response.error.description}`);
            });
            paymentObject.open();

        } catch (err) {
            console.error('Razorpay process error:', err);
            setError(err.response?.data?.message || err.message || 'An error occurred during the payment process.');
        }
        setPaymentLoading(false);
    };

    if (loading) return <p>Loading invoice details...</p>;
    

    return (
        <div style={{ padding: '20px' }}>
            <h2>Pay Invoice</h2>
            {invoice && (
                <div>
                    <p><strong>Invoice Number:</strong> {invoice.invoiceNumber}</p>
                    <p><strong>Client:</strong> {invoice.clientName}</p>
                    <p><strong>Amount Due:</strong> ₹{invoice.totalAmount?.toFixed(2)}</p>
                    <hr />
                    <button 
                        onClick={displayRazorpay} 
                        disabled={paymentLoading || !invoice}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            color: '#fff',
                            backgroundColor: '#28a745',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: paymentLoading || !invoice ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {paymentLoading ? 'Processing...' : 'Pay with Razorpay'}
                    </button>
                </div>
            )}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
             {!invoice && !loading && !error && <p>Invoice not found or could not be loaded.</p>} {/* Handle case where invoice is null but no specific error from fetch */}
        </div>
    );
};

export default PayInvoicePage;
