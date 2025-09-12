import React, { useState } from 'react';
import { Copy, CheckCircle2, Download, Book, Code2 } from 'lucide-react';

const SchemaPage = () => {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const schemaFields = [
    { name: 'title', type: 'string', required: true, maxLength: 200, description: 'Deck title' },
    { name: 'subtitle', type: 'string', required: false, maxLength: 300, description: 'Optional subtitle' },
    { name: 'deckIcon', type: 'string', required: false, maxLength: 10, description: 'Deck icon (displayed in deck lists and navigation)' },
    { name: 'cardBackIcon', type: 'string', required: false, maxLength: 10, description: 'Card back icon (displayed on the back of each card)' },
    { name: 'copyright', type: 'string', required: false, maxLength: 500, description: 'Copyright notice on card backs' },
    { name: 'cards', type: 'array', required: true, minLength: 1, description: 'Array of card objects' }
  ];

  const cardFields = [
    { name: 'title', type: 'string', required: true, maxLength: 100, description: 'Card title' },
    { name: 'headerIcon', type: 'string', required: false, maxLength: 10, description: 'Card header icon (small icon in header)' },
    { name: 'heroImage', type: 'string', required: false, maxLength: 10, description: 'Card hero image (large emoji in center)' },
    { name: 'type', type: 'string', required: false, maxLength: 50, description: 'Card type (e.g., KPI, Goal, Action)' },
    { name: 'description', type: 'string', required: false, maxLength: 500, description: 'Main card text (supports HTML)' },
    { name: 'flavorText', type: 'string', required: false, maxLength: 200, description: 'Additional flavor text' },
    { name: 'styleClass', type: 'string', required: false, maxLength: 100, description: 'CSS class for styling' }
  ];

  const exampleDeck = {
    "title": "Workshop KPI Cards",
    "subtitle": "Key Performance Indicators for Business Analysis",
    "deckIcon": "🎴",
    "cardBackIcon": "📊",
    "copyright": "Your Company Name - All Rights Reserved",
    "cards": [
      {
        "title": "Customer Satisfaction",
        "headerIcon": "😊",
        "heroImage": "⭐",
        "type": "KPI",
        "description": "Measures how satisfied customers are with products and services. <br><strong>Target:</strong> > 90%",
        "flavorText": "The foundation of business success",
        "styleClass": "card-kpi"
      },
      {
        "title": "Revenue Growth",
        "headerIcon": "💰",
        "heroImage": "📈",
        "type": "Business Goal",
        "description": "Year-over-year revenue increase percentage. Tracks business expansion and market success.",
        "flavorText": "Growth is essential for sustainability",
        "styleClass": "card-goal"
      },
      {
        "title": "Team Training",
        "headerIcon": "🎯",
        "heroImage": "🚀",
        "type": "Action",
        "description": "Implement quarterly training sessions to improve team skills and productivity.",
        "flavorText": "Invest in your people",
        "styleClass": "card-action"
      }
    ]
  };

  const downloadExample = () => {
    const blob = new Blob([JSON.stringify(exampleDeck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'example-deck.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Book className="w-6 h-6 mr-3" />
            JSON Schema Documentation
          </h1>
          <p className="text-gray-600 mt-2">
            Complete reference for creating KPI card decks with JSON
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <p className="text-gray-700 mb-4">
          KPI Card decks are defined using JSON format. You can create decks externally and upload them 
          through the web interface, or use them directly with the CLI tool.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Code2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Usage</p>
              <p className="text-sm text-blue-700">
                Create your JSON file following this schema, then upload it when creating a new deck 
                or use it with the CLI: <code className="bg-blue-100 px-1 rounded">node kpi-card-generator.js generate -i your-deck.json</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Schema */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Deck Schema</h2>
          <p className="text-sm text-gray-600 mt-1">Root level properties for the deck object</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-900">Field</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-900">Required</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-900">Constraints</th>
                  <th className="text-left py-2 font-medium text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schemaFields.map((field) => (
                  <tr key={field.name}>
                    <td className="py-3 pr-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {field.name}
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{field.type}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        field.required 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {field.required ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">
                      {field.maxLength && `Max: ${field.maxLength} chars`}
                      {field.minLength && `Min: ${field.minLength} items`}
                    </td>
                    <td className="py-3 text-sm text-gray-700">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Card Schema */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Card Schema</h2>
          <p className="text-sm text-gray-600 mt-1">Properties for individual cards within the carte array</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-900">Field</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-900">Required</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-900">Constraints</th>
                  <th className="text-left py-2 font-medium text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cardFields.map((field) => (
                  <tr key={field.name}>
                    <td className="py-3 pr-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {field.name}
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{field.type}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        field.required 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {field.required ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">
                      {field.maxLength && `Max: ${field.maxLength} chars`}
                    </td>
                    <td className="py-3 text-sm text-gray-700">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Example */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Complete Example</h2>
              <p className="text-sm text-gray-600 mt-1">A fully functional deck with all field types</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(exampleDeck, null, 2), 'example')}
                className="btn btn-secondary text-sm inline-flex items-center"
              >
                {copiedField === 'example' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </>
                )}
              </button>
              <button
                onClick={downloadExample}
                className="btn btn-primary text-sm inline-flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Example
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{JSON.stringify(exampleDeck, null, 2)}</code>
          </pre>
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tips & Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">HTML Support</h3>
            <p className="text-sm text-green-700">
              The <code>description</code> field supports basic HTML tags like <code>&lt;strong&gt;</code>, 
              <code>&lt;br&gt;</code>, <code>&lt;em&gt;</code> for rich formatting.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Icons & Emojis</h3>
            <p className="text-sm text-blue-700">
              Use Unicode emojis for icons. They work consistently across all platforms 
              and look great in both digital and print formats.
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Card Classes</h3>
            <p className="text-sm text-yellow-700">
              Common classes: <code>card-kpi</code>, <code>card-goal</code>, 
              <code>card-action</code> for different styling themes.
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-800 mb-2">Validation</h3>
            <p className="text-sm text-purple-700">
              The system validates your JSON automatically. Check the console 
              for detailed error messages if upload fails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaPage;