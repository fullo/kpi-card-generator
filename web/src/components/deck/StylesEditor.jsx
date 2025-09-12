import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Save, RotateCcw, Trash2, Eye, Settings } from 'lucide-react';
import { useStyles } from '../../hooks/useStyles';
import ColorPicker from '../ui/ColorPicker';
import Button from '../ui/Button';
import StylesPreview from '../preview/StylesPreview';

const StylesEditor = ({ 
  deckId, 
  deckTitle,
  onSave,
  className = ''
}) => {
  const {
    availableStyles,
    currentConfig,
    loading,
    saving,
    error,
    previewHtml,
    saveConfig,
    generatePreview,
    removeConfig,
    clearPreview,
    createDefaultConfig
  } = useStyles(deckId);

  // Local state for form values (matching Iteration 5 spec)
  const [formConfig, setFormConfig] = useState({
    cardTitleColor: null,
    cardTitleBgColor: null,
    showHeroImage: true,
    descriptionTextSize: 'm'
  });
  const [selectedStyleClass, setSelectedStyleClass] = useState(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Initialize form with current config or defaults
  useEffect(() => {
    if (currentConfig && selectedStyleClass) {
      // Extract the configuration object - currentConfig might be wrapped
      const configData = currentConfig.configuration || currentConfig;
      
      // Find the style configuration for the selected styleClass
      const styleClassConfig = configData.styleClass?.find(
        config => config.class === selectedStyleClass
      );
      
      if (styleClassConfig) {
        // Only use the style properties, not the class name
        const { class: _, ...styleProps } = styleClassConfig;
        setFormConfig(styleProps);
      } else {
        // No config for this styleClass, use defaults
        setFormConfig(createDefaultConfig());
      }
      setHasUnsavedChanges(false);
    } else if (availableStyles.length > 0) {
      const defaultConfig = createDefaultConfig();
      setFormConfig(defaultConfig);
      setHasUnsavedChanges(false);
    }
  }, [currentConfig, availableStyles, createDefaultConfig, selectedStyleClass]);

  // Mark as having unsaved changes when form changes
  const handleFormChange = useCallback((field, value) => {
    setFormConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      
      // Get the current style config for comparison
      let currentStyleConfig = createDefaultConfig();
      if (currentConfig && selectedStyleClass) {
        const configData = currentConfig.configuration || currentConfig;
        const styleClassConfig = configData.styleClass?.find(
          config => config.class === selectedStyleClass
        );
        if (styleClassConfig) {
          const { class: _, ...styleProps } = styleClassConfig;
          currentStyleConfig = styleProps;
        }
      }
      
      setHasUnsavedChanges(JSON.stringify(newConfig) !== JSON.stringify(currentStyleConfig));
      return newConfig;
    });
  }, [currentConfig, createDefaultConfig, selectedStyleClass]);

  // Note: handleStyleClassToggle is not used in the current implementation
  // since we work with individual styleClass configurations

  const handleSave = async () => {
    if (!selectedStyleClass) {
      return;
    }
    
    try {
      // Format data for API: include styleClass + configuration
      const apiPayload = {
        styleClass: selectedStyleClass,
        ...formConfig
      };
      
      console.log('Saving style config:', apiPayload);
      const savedConfig = await saveConfig(apiPayload);
      setHasUnsavedChanges(false);
      onSave?.(savedConfig);
    } catch (err) {
      console.error('Failed to save styles:', err);
    }
  };

  const handlePreview = async () => {
    if (!selectedStyleClass) {
      return;
    }
    
    try {
      // Format data for preview API: include styleClass + configuration  
      const previewPayload = {
        styleClass: selectedStyleClass,
        ...formConfig
      };
      
      await generatePreview(previewPayload);
      setIsPreviewMode(true);
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }
  };

  const handleReset = () => {
    // Reset to current saved configuration for this styleClass
    if (currentConfig && selectedStyleClass) {
      const configData = currentConfig.configuration || currentConfig;
      const styleClassConfig = configData.styleClass?.find(
        config => config.class === selectedStyleClass
      );
      
      if (styleClassConfig) {
        const { class: _, ...styleProps } = styleClassConfig;
        setFormConfig(styleProps);
      } else {
        setFormConfig(createDefaultConfig());
      }
    } else {
      setFormConfig(createDefaultConfig());
    }
    setHasUnsavedChanges(false);
    clearPreview();
  };

  const handleResetStyleClass = async () => {
    if (!selectedStyleClass) {
      return;
    }
    
    if (window.confirm(`Are you sure you want to reset "${selectedStyleClass}" to default styles? This action cannot be undone.`)) {
      try {
        // Reset to default configuration for this styleClass
        const defaultConfig = createDefaultConfig();
        setFormConfig(defaultConfig);
        setHasUnsavedChanges(true); // Mark as changed so user can save the reset
        clearPreview();
      } catch (err) {
        console.error('Failed to reset styles:', err);
      }
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Are you sure you want to remove all custom styles? This action cannot be undone.')) {
      try {
        await removeConfig();
        setFormConfig(createDefaultConfig());
        setHasUnsavedChanges(false);
        clearPreview();
      } catch (err) {
        console.error('Failed to remove styles:', err);
      }
    }
  };

  if (loading && !availableStyles.length) {
    return (
      <div className={`card ${className}`}>
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading style options...</p>
        </div>
      </div>
    );
  }

  if (!availableStyles.length && !loading) {
    return (
      <div className={`card ${className}`}>
        <div className="p-6 text-center text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Style Classes Available</h3>
          <p className="text-sm">
            This deck doesn't have any cards with style classes to customize.
            Add cards with style classes to enable style customization.
          </p>
        </div>
      </div>
    );
  }

  const textSizeOptions = [
    { value: 'xs', label: 'Extra Small (6pt)', description: '6pt, line-height 1.2' },
    { value: 's', label: 'Small (7pt)', description: '7pt, line-height 1.3' },
    { value: 'm', label: 'Medium (8pt)', description: '8pt, line-height 1.4' },
    { value: 'l', label: 'Large (9pt)', description: '9pt, line-height 1.5' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Palette className="w-6 h-6 text-primary-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Style Customization</h2>
                <p className="text-sm text-gray-600">
                  Customize the appearance of your cards
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!deckId || !selectedStyleClass}
                className="inline-flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="inline-flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
              
              {currentConfig && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  disabled={saving}
                  className="inline-flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
              
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges || !selectedStyleClass}
                className="inline-flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Style Class Selection */}
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Style Class to Customize
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableStyles.map((styleClass) => (
              <button
                key={styleClass}
                onClick={() => setSelectedStyleClass(styleClass)}
                className={`
                  p-3 text-left border rounded-lg transition-colors
                  ${selectedStyleClass === styleClass
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="font-medium text-sm">
                  {styleClass}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  .{styleClass}
                </div>
              </button>
            ))}
          </div>
          {!selectedStyleClass && (
            <p className="text-sm text-orange-600 mt-3">
              Please select a style class to customize its appearance.
            </p>
          )}
        </div>

        {/* Style Configuration Form */}
        {selectedStyleClass && (
          <div className="p-6 space-y-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Customizing: <span className="text-primary-600">{selectedStyleClass}</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    Configure the visual appearance for cards with the "{selectedStyleClass}" style class.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetStyleClass}
                  className="inline-flex items-center text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Title Color */}
              <ColorPicker
                label="Card Title Color"
                value={formConfig.cardTitleColor}
                onChange={(color) => handleFormChange('cardTitleColor', color)}
                allowNull={true}
                placeholder="Use default color"
              />

              {/* Card Title Background Color */}
              <ColorPicker
                label="Card Title Background Color"
                value={formConfig.cardTitleBgColor}
                onChange={(color) => handleFormChange('cardTitleBgColor', color)}
                allowNull={true}
                placeholder="Use default background"
              />

              {/* Description Text Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description Text Size
                </label>
                <select
                  value={formConfig.descriptionTextSize}
                  onChange={(e) => handleFormChange('descriptionTextSize', e.target.value)}
                  className="input"
                >
                  {textSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Controls font size and line height for card descriptions
                </p>
              </div>

              {/* Show Hero Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Image Display
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="showHeroImage"
                      checked={formConfig.showHeroImage === true}
                      onChange={() => handleFormChange('showHeroImage', true)}
                      className="mr-2"
                    />
                    Show
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="showHeroImage"
                      checked={formConfig.showHeroImage === false}
                      onChange={() => handleFormChange('showHeroImage', false)}
                      className="mr-2"
                    />
                    Hide
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Toggle visibility of the hero image area on cards
                </p>
              </div>
            </div>

            {/* Style Preview */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview CSS</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 font-mono">
{`/* Styles for ${selectedStyleClass} */
${formConfig.cardTitleColor ? `.${selectedStyleClass} .card-title {
  color: ${formConfig.cardTitleColor};
}` : ''}
${formConfig.cardTitleBgColor ? `.${selectedStyleClass} .card-type-banner {
  background-color: ${formConfig.cardTitleBgColor};${formConfig.cardTitleColor ? `
  color: ${formConfig.cardTitleColor};` : ''}
}` : ''}
${!formConfig.showHeroImage ? `.${selectedStyleClass} .card-image-area {
  display: none !important;
}` : ''}
.${selectedStyleClass} .card-description-box .main-text {
  font-size: ${textSizeOptions.find(opt => opt.value === formConfig.descriptionTextSize)?.description.split(',')[0]} !important;
  line-height: ${textSizeOptions.find(opt => opt.value === formConfig.descriptionTextSize)?.description.split('line-height ')[1]} !important;
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {(isPreviewMode || previewHtml) && (
        <StylesPreview
          previewHtml={previewHtml}
          loading={loading}
          error={error}
          onRefresh={handlePreview}
          deckTitle={deckTitle}
        />
      )}
    </div>
  );
};

export default StylesEditor;