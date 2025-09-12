import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, RotateCcw, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

const StylesPreview = ({ 
  previewHtml,
  loading = false,
  error = null,
  onRefresh,
  deckTitle = 'Deck Preview',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef(null);

  // Update iframe when previewHtml changes
  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Write the HTML content to the iframe
      doc.open();
      doc.write(previewHtml);
      doc.close();

      // Ensure iframe is properly sized
      const resizeIframe = () => {
        try {
          const body = doc.body;
          const html = doc.documentElement;
          const height = Math.max(
            body?.scrollHeight || 0,
            body?.offsetHeight || 0,
            html?.clientHeight || 0,
            html?.scrollHeight || 0,
            html?.offsetHeight || 0
          );
          
          if (height > 0) {
            iframe.style.height = `${Math.min(height, 800)}px`;
          }
        } catch (err) {
          console.warn('Could not resize iframe:', err);
          iframe.style.height = '600px';
        }
      };

      // Resize after content loads
      iframe.onload = resizeIframe;
      setTimeout(resizeIframe, 100); // Fallback in case onload doesn't fire
    }
  }, [previewHtml, iframeKey]);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1); // Force iframe re-render
    onRefresh?.();
  };

  const openInNewWindow = () => {
    if (!previewHtml) return;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(previewHtml);
      newWindow.document.close();
      newWindow.document.title = `${deckTitle} - Style Preview`;
    }
  };

  if (!previewHtml && !loading && !error) {
    return (
      <div className={`card ${className}`}>
        <div className="p-6 text-center text-gray-500">
          <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Preview Available</h3>
          <p className="text-sm">
            Configure your styles and click "Generate Preview" to see how your cards will look.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Style Preview</h3>
              <p className="text-sm text-gray-600">
                Preview of your styled deck
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh preview"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewWindow}
              disabled={!previewHtml || loading}
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse preview' : 'Expand preview'}
            >
              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="ml-2">
                {isExpanded ? 'Collapse' : 'Expand'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-none' : 'max-h-96 overflow-hidden'}`}>
        {loading && (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Generating preview...</p>
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 text-red-400">⚠</div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">
                    Preview Error
                  </h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewHtml && !loading && !error && (
          <div className="relative">
            {/* Iframe Preview */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              title="Style Preview"
              className="w-full border-none bg-white"
              style={{ 
                minHeight: '400px',
                height: '600px' // Default height, will be adjusted by script
              }}
              sandbox="allow-same-origin"
            />
            
            {/* Overlay for collapsed state */}
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Footer for collapsed state */}
      {!isExpanded && previewHtml && !loading && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-primary-600 hover:text-primary-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StylesPreview;