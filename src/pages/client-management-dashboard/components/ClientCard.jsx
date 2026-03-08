import React from 'react';
import Image from '../../../components/AppImage';


const ClientCard = ({ client, isSelected, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-success/10 text-success';
      case 'Pending':
        return 'bg-warning/10 text-warning';
      case 'Inactive':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border transition-smooth cursor-pointer hover:shadow-brand ${
        isSelected
          ? 'border-primary bg-primary/5' :'border-border bg-card hover:border-primary/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={client?.logo}
            alt={client?.logoAlt}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-heading font-semibold text-sm text-foreground truncate">
            {client?.companyName}
          </h4>
          <p className="text-xs text-muted-foreground truncate mt-1">
            {client?.primaryContact}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-1 rounded text-xs font-caption font-medium ${getStatusColor(
                client?.status
              )}`}
            >
              {client?.status}
            </span>
            <span className="text-xs text-muted-foreground">
              {client?.activeProposals} proposals
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;