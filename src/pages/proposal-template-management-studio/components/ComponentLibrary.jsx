import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ComponentLibrary = ({ onInsert, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const componentBlocks = [
    {
      id: 1,
      name: 'Executive Summary',
      category: 'content',
      description: 'Standard executive summary template with key highlights',
      content: '<h2>Executive Summary</h2>\n<p>{{client_name}} has requested a comprehensive proposal for {{project_title}}. This document outlines our approach, methodology, and deliverables.</p>',
      usageCount: 156,
    },
    {
      id: 2,
      name: 'Pricing Table',
      category: 'formatting',
      description: 'Professional pricing breakdown table',
      content: '<table style="width:100%; border-collapse:collapse;">\n<tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>\n<tr><td>Service 1</td><td>1</td><td>$1,000</td><td>$1,000</td></tr>\n</table>',
      usageCount: 243,
    },
    {
      id: 3,
      name: 'Terms & Conditions',
      category: 'legal',
      description: 'Standard terms and conditions clause',
      content: '<h3>Terms & Conditions</h3>\n<p>This proposal is valid for 30 days from the date of submission. Payment terms are Net 30 upon project completion.</p>',
      usageCount: 189,
    },
    {
      id: 4,
      name: 'Project Timeline',
      category: 'content',
      description: 'Milestone-based project timeline',
      content: '<h3>Project Timeline</h3>\n<ul>\n<li>Phase 1: Discovery & Planning (2 weeks)</li>\n<li>Phase 2: Development (6 weeks)</li>\n<li>Phase 3: Testing & Deployment (2 weeks)</li>\n</ul>',
      usageCount: 198,
    },
    {
      id: 5,
      name: 'Confidentiality Clause',
      category: 'legal',
      description: 'Standard confidentiality agreement',
      content: '<h4>Confidentiality</h4>\n<p>All information shared during this engagement shall remain confidential and proprietary to both parties.</p>',
      usageCount: 167,
    },
    {
      id: 6,
      name: 'Team Introduction',
      category: 'content',
      description: 'Team member profiles section',
      content: '<h3>Our Team</h3>\n<p>Our dedicated team brings extensive experience in delivering successful projects similar to yours.</p>',
      usageCount: 134,
    },
  ];

  const categories = [
    { value: 'all', label: 'All Components', icon: 'Grid' },
    { value: 'content', label: 'Content Blocks', icon: 'FileText' },
    { value: 'formatting', label: 'Formatting', icon: 'Layout' },
    { value: 'legal', label: 'Legal Clauses', icon: 'Scale' },
  ];

  const filteredComponents = componentBlocks?.filter(block => {
    const matchesSearch = block?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         block?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || block?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-brand-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-1">
              Component Library
            </h2>
            <p className="text-sm text-muted-foreground font-caption">
              Reusable content blocks and templates
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
            aria-label="Close component library"
          />
        </div>

        <div className="p-4 md:p-6 border-b border-border space-y-4">
          <Input
            type="search"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
          />

          <div className="flex flex-wrap gap-2">
            {categories?.map((category) => (
              <button
                key={category?.value}
                onClick={() => setSelectedCategory(category?.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-caption font-medium text-sm transition-smooth ${
                  selectedCategory === category?.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon name={category?.icon} size={16} />
                <span>{category?.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComponents?.map((block) => (
              <div
                key={block?.id}
                className="p-4 md:p-5 bg-muted rounded-lg border border-border hover:border-primary transition-smooth"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-heading font-semibold text-foreground mb-1 line-clamp-1">
                      {block?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-caption line-clamp-2">
                      {block?.description}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded-md text-xs font-caption font-medium whitespace-nowrap">
                    {block?.category}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-caption">
                    Used {block?.usageCount} times
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={() => onInsert(block?.content)}
                  >
                    Insert
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredComponents?.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Icon name="Search" size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-caption">
                No components found matching your search
              </p>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-border">
          <Button
            variant="default"
            fullWidth
            onClick={onClose}
          >
            Close Library
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComponentLibrary;