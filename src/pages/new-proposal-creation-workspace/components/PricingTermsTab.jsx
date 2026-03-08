import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const PricingTermsTab = ({ formData, onChange }) => {
  const [lineItems, setLineItems] = useState([
    { id: 1, description: 'Software Development', quantity: 1, unitPrice: 50000, total: 50000 },
    { id: 2, description: 'Project Management', quantity: 1, unitPrice: 15000, total: 15000 }
  ]);

  const [discounts, setDiscounts] = useState([]);
  const [taxRate, setTaxRate] = useState(10);

  const addLineItem = () => {
    const newItem = {
      id: lineItems?.length + 1,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems?.map(item => {
      if (item?.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated?.quantity * updated?.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const deleteLineItem = (id) => {
    setLineItems(lineItems?.filter(item => item?.id !== id));
  };

  const addDiscount = () => {
    const newDiscount = {
      id: discounts?.length + 1,
      name: 'New Discount',
      type: 'percentage',
      value: 0
    };
    setDiscounts([...discounts, newDiscount]);
  };

  const subtotal = lineItems?.reduce((sum, item) => sum + item?.total, 0);
  const discountAmount = discounts?.reduce((sum, discount) => {
    if (discount?.type === 'percentage') {
      return sum + (subtotal * discount?.value / 100);
    }
    return sum + discount?.value;
  }, 0);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const totalAmount = afterDiscount + taxAmount;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading font-semibold text-foreground">Pricing & Terms</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define line items, discounts, and payment terms
        </p>
      </div>
      {/* Line Items */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-heading font-semibold text-foreground">Line Items</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addLineItem}
            iconName="Plus"
            iconPosition="left"
            iconSize={16}
          >
            Add Item
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineItems?.map((item) => (
                <tr key={item?.id} className="hover:bg-muted/30 transition-smooth">
                  <td className="px-6 py-4">
                    <Input
                      value={item?.description}
                      onChange={(e) => updateLineItem(item?.id, 'description', e?.target?.value)}
                      placeholder="Item description"
                      className="w-full"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      value={item?.quantity}
                      onChange={(e) => updateLineItem(item?.id, 'quantity', parseFloat(e?.target?.value) || 0)}
                      className="w-24"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      value={item?.unitPrice}
                      onChange={(e) => updateLineItem(item?.id, 'unitPrice', parseFloat(e?.target?.value) || 0)}
                      className="w-32"
                      leftIcon="DollarSign"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-foreground">
                      ${item?.total?.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLineItem(item?.id)}
                      iconName="Trash2"
                      iconSize={16}
                      className="text-destructive hover:text-destructive"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Discounts */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">Discounts</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addDiscount}
            iconName="Plus"
            iconPosition="left"
            iconSize={16}
          >
            Add Discount
          </Button>
        </div>

        {discounts?.length > 0 ? (
          <div className="space-y-3">
            {discounts?.map((discount) => (
              <div key={discount?.id} className="flex items-center gap-3">
                <Input
                  value={discount?.name}
                  onChange={(e) => {
                    setDiscounts(discounts?.map(d => 
                      d?.id === discount?.id ? { ...d, name: e?.target?.value } : d
                    ));
                  }}
                  placeholder="Discount name"
                  className="flex-1"
                />
                <Select
                  value={discount?.type}
                  onChange={(e) => {
                    setDiscounts(discounts?.map(d => 
                      d?.id === discount?.id ? { ...d, type: e?.target?.value } : d
                    ));
                  }}
                  className="w-40"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </Select>
                <Input
                  type="number"
                  value={discount?.value}
                  onChange={(e) => {
                    setDiscounts(discounts?.map(d => 
                      d?.id === discount?.id ? { ...d, value: parseFloat(e?.target?.value) || 0 } : d
                    ));
                  }}
                  className="w-32"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDiscounts(discounts?.filter(d => d?.id !== discount?.id))}
                  iconName="Trash2"
                  iconSize={16}
                  className="text-destructive hover:text-destructive"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No discounts applied</p>
        )}
      </div>
      {/* Tax & Total */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Summary</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">${subtotal?.toLocaleString()}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-green-600">-${discountAmount?.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tax</span>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e?.target?.value) || 0)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <span className="font-medium text-foreground">${taxAmount?.toLocaleString()}</span>
          </div>
          
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">Total Amount</span>
            <span className="text-2xl font-bold text-primary">${totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>
      {/* Approval Workflow */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Approval Workflow</h3>
        
        <Select
          value={formData?.approvalWorkflow || ''}
          onChange={(e) => onChange('approvalWorkflow', e?.target?.value)}
          className="w-full"
        >
          <option value="">Select approval workflow</option>
          <option value="standard">Standard Approval (Manager)</option>
          <option value="executive">Executive Approval (Director+)</option>
          <option value="financial">Financial Review Required</option>
          <option value="none">No Approval Required</option>
        </Select>
        
        {formData?.approvalWorkflow && (
          <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-primary mt-0.5" />
              <p className="text-sm text-foreground">
                This proposal will require approval from the selected workflow before submission.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingTermsTab;