import React from 'react';
import styles from './InvoiceForm.module.css'; // Import the shared CSS module

const LineItemInput = ({ item, index, onLineItemChange, onRemoveLineItem }) => { // Renamed props for clarity
  const handleInputChange = (e) => {
    // Pass the field name ('description', 'quantity', 'unitPrice')
    onLineItemChange(index, e.target.name, e.target.value);
  };

  return (
    <div className={styles.lineItemRow}>
      <div className={`${styles.lineItemField} ${styles.description}`}>
        <input
          type="text"
          name="description"
          placeholder="Item Description"
          value={item.description}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className={`${styles.lineItemField} ${styles.quantity}`}>
        <input
          type="number"
          name="quantity"
          placeholder="Qty"
          value={item.quantity}
          onChange={handleInputChange}
          required
          min="1"
        />
      </div>
      <div className={`${styles.lineItemField} ${styles.unitPrice}`}>
        <input
          type="number"
          name="unitPrice"
          placeholder="Unit Price"
          value={item.unitPrice}
          onChange={handleInputChange}
          required
          min="0"
          step="0.01"
        />
      </div>
      <div className={styles.lineItemTotal}>
        ₹{(item.quantity * item.unitPrice).toFixed(2)}
      </div>
      <button
        type="button"
        onClick={() => onRemoveLineItem(index)}
        className={styles.lineItemRemoveButton}
      >
        Remove
      </button>
    </div>
  );
};

export default LineItemInput;
