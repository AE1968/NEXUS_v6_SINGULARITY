# 🔑 NEXUS v7.0 - Claude API Key Configuration

## What This File Does:
Automatically configures Claude Sonnet 4.5 API key for NEXUS v7.0

## Quick Setup:

```bash
# Run the configuration script
python configure_claude.py
```

The script will:
1. ✅ Check if Claude is already configured
2. ✅ Guide you to get your API key from Anthropic
3. ✅ Test the API key locally
4. ✅ Show you how to configure it on Railway
5. ✅ Verify the deployment

## Manual Configuration:

If you prefer to configure manually:

### 1. Get API Key:
- Go to: https://console.anthropic.com/
- Sign up/login
- Settings → API Keys → Create Key
- Copy key (starts with `sk-ant-...`)

### 2. Configure Railway:
- Dashboard: https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131
- Click: Variables tab
- Add: `ANTHROPIC_API_KEY` = your_key
- Railway auto-redeploys

### 3. Test:
- Open: https://chipper-melba-0f3b83.netlify.app
- Type: `nexus:think How does AI work?`
- Should use Claude Sonnet 4.5

## Commands That Use Claude:

| Command | Description |
|---------|-------------|
| `nexus:think <question>` | Deep reasoning mode |
| `nexus:analyze <data>` | Data analysis |
| `nexus:code <task>` | Coding assistance |
| `explain how...` | Complex explanations |
| `why does...` | Causal reasoning |
| `compare...` | Comparative analysis |

## Fallback Behavior:

If Claude API key is NOT configured:
- ✅ System automatically falls back to Gemini 2.0
- ✅ All features still work
- ⚠️ No extended thinking mode (5000 tokens)

## Costs:

Claude Sonnet 4.5 pricing (as of 2024):
- Input: $3 per million tokens
- Output: $15 per million tokens
- Extended thinking adds thinking tokens to input cost

Example: A complex "nexus:think" query might use:
- 5000 thinking tokens + 500 input + 1000 output = ~$0.02

## Security:

⚠️ **NEVER commit your API key to Git!**

The `.env` file is already in `.gitignore` to prevent accidental commits.

## Troubleshooting:

### "Claude not available" error:
1. Check Railway Variables has `ANTHROPIC_API_KEY`
2. Verify key starts with `sk-ant-`
3. Check key is valid at https://console.anthropic.com/
4. Wait 60s after Railway variable changes

### "Falling back to Gemini":
- This is NORMAL if no API key configured
- System works perfectly with Gemini only
- Claude just adds extended thinking capabilities

### Test locally:
```python
python -c "from configure_claude import test_claude_connection; test_claude_connection('your-key-here')"
```

## Support:

- Anthropic Console: https://console.anthropic.com/
- Railway Dashboard: https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131
- NEXUS Docs: See `COMENZI_ADMIN.md` and `COMENZI_UTILIZATOR.md`

---

**After configuration, all claude commands will work automatically!** ✨
