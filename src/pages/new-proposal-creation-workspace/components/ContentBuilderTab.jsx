import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ContentBuilderTab = ({ formData, onChange }) => {
  const [sections, setSections] = useState([
    { id: 1, title: 'Executive Summary', content: '', order: 1 },
    { id: 2, title: 'Project Scope', content: '', order: 2 },
    { id: 3, title: 'Deliverables', content: '', order: 3 }
  ]);

  const [activeSection, setActiveSection] = useState(1);

  const templateBlocks = [
    { id: 1, name: 'Executive Summary', icon: 'FileText', category: 'Standard' },
    { id: 2, name: 'Project Timeline', icon: 'Calendar', category: 'Standard' },
    { id: 3, name: 'Team Introduction', icon: 'Users', category: 'Standard' },
    { id: 4, name: 'Technical Approach', icon: 'Code', category: 'Technical' },
    { id: 5, name: 'Risk Assessment', icon: 'AlertTriangle', category: 'Analysis' },
    { id: 6, name: 'Success Metrics', icon: 'TrendingUp', category: 'Analysis' }
  ];

  const addSection = () => {
    const newSection = {
      id: sections?.length + 1,
      title: `New Section ${sections?.length + 1}`,
      content: '',
      order: sections?.length + 1
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection?.id);
  };

  const deleteSection = (sectionId) => {
    setSections(sections?.filter(s => s?.id !== sectionId));
    if (activeSection === sectionId && sections?.length > 1) {
      setActiveSection(sections?.[0]?.id);
    }
  };

  const updateSection = (sectionId, field, value) => {
    setSections(sections?.map(s => 
      s?.id === sectionId ? { ...s, [field]: value } : s
    ));
  };

  const moveSection = (sectionId, direction) => {
    const index = sections?.findIndex(s => s?.id === sectionId);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < sections?.length - 1)
    ) {
      const newSections = [...sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSections[index], newSections[targetIndex]] = [newSections?.[targetIndex], newSections?.[index]];
      setSections(newSections);
    }
  };

  const activeContent = sections?.find(s => s?.id === activeSection);

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Section List */}
      <div className="w-64 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-heading font-semibold text-foreground">Sections</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addSection}
            iconName="Plus"
            iconSize={16}
          />
        </div>

        <div className="space-y-2">
          {sections?.map((section, index) => (
            <div
              key={section?.id}
              className={`p-3 rounded-lg border transition-smooth cursor-pointer group ${
                activeSection === section?.id
                  ? 'border-primary bg-primary/10' :'border-border hover:border-primary hover:bg-muted'
              }`}
              onClick={() => setActiveSection(section?.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground">{section?.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {section?.content ? `${section?.content?.length} characters` : 'Empty'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                  <button
                    onClick={(e) => { e?.stopPropagation(); moveSection(section?.id, 'up'); }}
                    disabled={index === 0}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-background disabled:opacity-30"
                  >
                    <Icon name="ChevronUp" size={14} />
                  </button>
                  <button
                    onClick={(e) => { e?.stopPropagation(); moveSection(section?.id, 'down'); }}
                    disabled={index === sections?.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-background disabled:opacity-30"
                  >
                    <Icon name="ChevronDown" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Template Blocks */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Template Blocks</h4>
          <div className="space-y-2">
            {templateBlocks?.map((block) => (
              <button
                key={block?.id}
                className="w-full p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-smooth text-left group"
              >
                <div className="flex items-center gap-2">
                  <Icon name={block?.icon} size={16} className="text-muted-foreground group-hover:text-primary" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{block?.name}</p>
                    <p className="text-xs text-muted-foreground">{block?.category}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Right: Content Editor */}
      <div className="flex-1 space-y-4">
        {activeContent && (
          <>
            {/* Section Header */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Input
                  value={activeContent?.title}
                  onChange={(e) => updateSection(activeContent?.id, 'title', e?.target?.value)}
                  className="text-lg font-semibold flex-1 mr-4"
                  placeholder="Section Title"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSection(activeContent?.id)}
                  iconName="Trash2"
                  iconSize={16}
                  className="text-destructive hover:text-destructive"
                />
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" iconName="Bold" iconSize={16} />
                <Button variant="ghost" size="sm" iconName="Italic" iconSize={16} />
                <Button variant="ghost" size="sm" iconName="Underline" iconSize={16} />
                <div className="w-px h-6 bg-border" />
                <Button variant="ghost" size="sm" iconName="List" iconSize={16} />
                <Button variant="ghost" size="sm" iconName="ListOrdered" iconSize={16} />
                <div className="w-px h-6 bg-border" />
                <Button variant="ghost" size="sm" iconName="Link" iconSize={16} />
                <Button variant="ghost" size="sm" iconName="Image" iconSize={16} />
                <Button variant="ghost" size="sm" iconName="Table" iconSize={16} />
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-card border border-border rounded-lg p-6">
              <textarea
                value={activeContent?.content}
                onChange={(e) => updateSection(activeContent?.id, 'content', e?.target?.value)}
                placeholder="Start writing your content here..."
                rows={20}
                className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none resize-none font-body leading-relaxed"
              />
            </div>

            {/* Collaboration Comments */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="MessageSquare" size={16} className="text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Comments</h4>
              </div>
              <div className="text-sm text-muted-foreground">
                No comments yet. Add a comment to collaborate with your team.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContentBuilderTab;