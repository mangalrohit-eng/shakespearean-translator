# 🎯 Data & AI Opportunities Analyzer

An AI-powered web application that automatically identifies and tags Data, AI, and Analytics opportunities from your Excel opportunity files.

## Features

- 📊 **Excel Upload** - Drag & drop or browse to upload opportunity files
- 🎯 **Smart Filtering** - Automatically filters for US-Comms & Media opportunities
- 🤖 **AI Analysis** - Uses OpenAI GPT-4o-mini to analyze opportunity names
- 🏷️ **Intelligent Tagging** - Tags opportunities as AI, Analytics, Data, or None
- 📝 **Detailed Rationale** - Provides explanations for each tagging decision
- 💾 **Excel Export** - Downloads results with all tags and rationales
- ⚡ **Fast Processing** - Batch analysis with progress tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI GPT-4o-mini
- **Agent Framework**: LangGraph
- **Excel Processing**: xlsx library
- **Styling**: Custom CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key (get one at https://platform.openai.com/api-keys)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### Input Excel Columns

Your Excel file should contain these columns:
- **ID** - Opportunity ID
- **Client Name** - Client company name
- **Opp Name** - Opportunity/deal name
- **Client Group** - Industry/sector (must include "Comms & Media")
- **Deal Size** - Size category
- **Total** - Total value
- Other columns are optional

### Processing Pipeline

1. **Upload** → User uploads Excel file
2. **Filter** → Filters for "US-Comms & Media" in Client Group
3. **Analyze** → AI analyzes each opportunity name for:
   - **AI**: Machine Learning, NLP, Computer Vision, Chatbots, GenAI
   - **Analytics**: BI, Dashboards, Reporting, Insights, Visualization
   - **Data**: Data Engineering, ETL, Databases, Data Lakes, Governance
4. **Tag** → Assigns appropriate tags with confidence scores
5. **Export** → Creates Excel with results

### Output Excel Columns

- Opportunity ID
- Client Name
- Opportunity Name
- Client Group
- Deal Size
- Total
- AI Tag (Yes/No)
- Analytics Tag (Yes/No)
- Data Tag (Yes/No)
- Combined Tags (e.g., "AI, Analytics")
- Confidence Score (0-100%)
- Rationale (Detailed explanation)

## Deployment to Vercel

### Method 1: Via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variable:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
6. Click "Deploy"

### Method 2: Via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add your environment variable in the Vercel dashboard

## Usage

1. **Upload Excel** - Drag and drop your opportunities file
2. **Click Analyze** - Wait for AI processing (typically 1-2 seconds per opportunity)
3. **Download Results** - Get your tagged Excel file with rationale

## Cost Estimation

Using **OpenAI GPT-4o-mini**:
- **Input tokens**: ~$0.15 per 1M tokens
- **Output tokens**: ~$0.60 per 1M tokens
- **Per opportunity**: ~$0.0001 (0.01 cents)
- **100 opportunities**: ~$0.01
- **1,000 opportunities**: ~$0.10

Very affordable for business use! 💰

## Example Results

| Opportunity Name | Tags | Rationale |
|-----------------|------|-----------|
| AI Chatbot Platform | AI, Analytics | Deal explicitly mentions AI chatbot and will require analytics for performance tracking |
| Digital Marketing Campaign | None | Standard marketing work with no AI/Data components |
| Customer Data Lake | Data, Analytics | Requires data engineering to build data lake and analytics for insights |
| Generative AI Content Tool | AI | Clear generative AI application for content creation |

## Configuration

You can adjust the AI analysis parameters in `lib/agents/analyzer.ts`:
- **Temperature**: Controls creativity (default: 0.3 for conservative tagging)
- **Max tokens**: Response length (default: 300)
- **Model**: Currently using `gpt-4o-mini` (can switch to `gpt-4` for better quality)

## Project Structure

```
data-ai-opportunities/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Main API endpoint
│   ├── page.tsx                   # Upload UI
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Styles
├── lib/
│   ├── agents/
│   │   └── analyzer.ts            # AI analysis logic
│   ├── excel/
│   │   ├── reader.ts              # Excel parsing
│   │   └── writer.ts              # Excel generation
│   └── types.ts                   # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### "No Comms & Media opportunities found"
- Check that your Client Group column contains "Comms" or "Media"
- Case-insensitive matching is enabled

### "Analysis failed"
- Verify your OpenAI API key is correct
- Check you have sufficient API credits
- Ensure you're not hitting rate limits (add delays if needed)

### Excel file won't upload
- Ensure file is .xlsx or .xls format
- Check file size (should be under 50MB)

## Future Enhancements

- [ ] Real-time progress tracking UI
- [ ] Batch size controls for large files
- [ ] Multiple industry filter support
- [ ] Custom tagging categories
- [ ] Historical analysis comparison
- [ ] Human-in-the-loop review mode

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact your administrator.

---

**Built with ❤️ using Next.js, OpenAI, and LangGraph**
