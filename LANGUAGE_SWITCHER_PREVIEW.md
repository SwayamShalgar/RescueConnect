# Language Switcher Preview

## Visual Design

```
┌─────────────────────────────────────────────────────┐
│  RescueConnect                     🌐 Language ▼   │
│                                    └─────────────┘   │
│                                                      │
│  [When clicked, dropdown opens:]                    │
│                                                      │
│                              ┌──────────────────┐  │
│                              │ Select Language  │  │
│                              ├──────────────────┤  │
│                              │ English          │  │
│                              │ English (Default)│  │
│                              ├──────────────────┤  │
│                              │ Hindi            │  │
│                              │ हिंदी            │  │
│                              ├──────────────────┤  │
│                              │ Marathi          │  │
│                              │ मराठी            │  │
│                              ├──────────────────┤  │
│                              │ Telugu           │  │
│                              │ తెలుగు           │  │
│                              ├──────────────────┤  │
│                              │ Tamil            │  │
│                              │ தமிழ்            │  │
│                              ├──────────────────┤  │
│                              │ Kannada          │  │
│                              │ ಕನ್ನಡ            │  │
│                              ├──────────────────┤  │
│                              │ Gujarati         │  │
│                              │ ગુજરાતી          │  │
│                              ├──────────────────┤  │
│                              │ Bengali          │  │
│                              │ বাংলা            │  │
│                              ├──────────────────┤  │
│                              │ Malayalam        │  │
│                              │ മലയാളം          │  │
│                              ├──────────────────┤  │
│                              │ Punjabi          │  │
│                              │ ਪੰਜਾਬੀ          │  │
│                              ├──────────────────┤  │
│                              │ Urdu             │  │
│                              │ اردو             │  │
│                              └──────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Button States

### Default (Closed)
```
┌────────────────┐
│ 🌐 Language ▼ │
└────────────────┘
  White background
  Gray border
  Shadow on hover
```

### Hover
```
┌────────────────┐
│ 🌐 Language ▼ │  ← Larger shadow
└────────────────┘    Blue border
  Cursor: pointer
```

### Open (Dropdown visible)
```
┌────────────────┐
│ 🌐 Language ▲ │  ← Arrow rotates
└────────────────┘
        │
        ▼
  [Dropdown menu]
```

## Mobile View

```
 Phone Screen (375px)
┌──────────────────┐
│ [Menu]  🌐      │ ← Top-right corner
├──────────────────┤
│                  │
│   Page Content   │
│                  │
│                  │
│                  │
└──────────────────┘

[When tapped:]
┌──────────────────┐
│           ┌────┐│
│           │Eng │││
│           │हिं │││
│           │मरा │││ ← Scrollable
│           │తెల │││
│           │தமி │││
│           │ಕನ್ │││
│           └────┘││
└──────────────────┘
```

## Translation Example

### Before (English):
```
┌─────────────────────────────────┐
│  Volunteer Dashboard            │
│                                 │
│  Find available volunteers      │
│  near you for rescue            │
│                                 │
│  [View Map] [Emergency Alert]  │
└─────────────────────────────────┘
```

### After (Hindi - हिंदी):
```
┌─────────────────────────────────┐
│  स्वयंसेवक डैशबोर्ड             │
│                                 │
│  अपने पास उपलब्ध               │
│  स्वयंसेवकों को खोजें           │
│                                 │
│  [मानचित्र देखें] [आपातकाल]   │
└─────────────────────────────────┘
```

### After (Marathi - मराठी):
```
┌─────────────────────────────────┐
│  स्वयंसेवक डॅशबोर्ड             │
│                                 │
│  तुमच्या जवळ उपलब्ध            │
│  स्वयंसेवक शोधा                │
│                                 │
│  [नकाशा पहा] [आपत्कालीन]      │
└─────────────────────────────────┘
```

## Color Scheme

### Language Switcher Button:
- **Background**: White (#FFFFFF)
- **Border**: Gray (#E5E7EB)
- **Border (hover)**: Blue (#3B82F6)
- **Text**: Dark Gray (#374151)
- **Icon**: Blue (#2563EB)
- **Shadow**: Subtle (0 1px 3px rgba(0,0,0,0.1))

### Dropdown Menu:
- **Background**: White (#FFFFFF)
- **Border**: Gray (#E5E7EB)
- **Shadow**: Strong (0 10px 15px rgba(0,0,0,0.1))
- **Hover**: Light Blue (#EFF6FF)
- **Selected Text**: Blue (#2563EB)

## Positioning

### Desktop (>768px):
```
Position: fixed
Top: 16px (1rem)
Right: 16px (1rem)
Z-index: 10000
```

### Tablet (768px):
```
Position: fixed
Top: 12px
Right: 12px
Z-index: 10000
```

### Mobile (<640px):
```
Position: fixed
Top: 8px
Right: 8px
Z-index: 10000
Size: Slightly smaller button
```

## Interaction Flow

```
User Journey:
1. User sees globe icon (🌐)
   ↓
2. Recognizes as language selector
   ↓
3. Clicks/taps button
   ↓
4. Dropdown appears with languages
   ↓
5. User sees native language name
   ↓
6. User selects preferred language
   ↓
7. Page content translates
   ↓
8. Dropdown closes
   ↓
9. Language persists on navigation
```

## Accessibility

### Keyboard Navigation:
```
Tab       → Focus on button
Enter     → Open dropdown
↓/↑       → Navigate languages
Enter     → Select language
Esc       → Close dropdown
Tab       → Next element
```

### Screen Reader:
```
"Language selector button"
"Currently English"
"Press Enter to open menu"
"11 languages available"
```

## Animation

### Dropdown Opening:
```
0ms   → opacity: 0, scale: 0.95
200ms → opacity: 1, scale: 1
```

### Arrow Rotation:
```
0ms   → rotate(0deg)    ▼
200ms → rotate(180deg)  ▲
```

### Hover Effect:
```
0ms   → shadow: sm
150ms → shadow: lg
```

## Performance

### Load Time:
```
Google Script    → 50KB  (~200ms)
Component Code   → 3KB   (~10ms)
CSS Styles       → 1KB   (~5ms)
Total First Load → ~215ms
Cached           → Instant
```

### Translation Speed:
```
First translation → ~500ms
Cached translation → ~100ms
Switch language    → ~200ms
```

## Browser Compatibility

```
✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Opera 76+
✅ Samsung Internet 14+
✅ UC Browser 13+

❌ IE 11 (not supported)
❌ Opera Mini (limited support)
```

## Testing Checklist

```
□ Visible on all pages
□ Appears in correct position
□ Dropdown opens on click
□ All languages listed
□ Native names displayed correctly
□ Translations work
□ Persists across navigation
□ Mobile responsive
□ Keyboard accessible
□ No console errors
□ Works offline (after cache)
□ No Google branding visible
```

## Example Screenshots

### Desktop View:
```
[Header Area]
┌────────────────────────────────────────┐
│  Logo    Navigation    🌐 Language ▼ │
└────────────────────────────────────────┘
```

### With Dropdown Open:
```
[Header Area]
┌────────────────────────────────────────┐
│  Logo    Navigation    🌐 Language ▲ │
│                        ┌─────────────┐│
│                        │English      ││
│                        │हिंदी        ││
│                        │मराठी        ││
│                        └─────────────┘│
└────────────────────────────────────────┘
```

### Mobile View (Portrait):
```
┌──────────────┐
│ ☰    🌐     │
├──────────────┤
│              │
│   Content    │
│              │
└──────────────┘
```

### Mobile Dropdown:
```
┌──────────────┐
│      ┌─────┐│
│      │Eng  ││
│      │हिं  ││
│      │मरा  ││
│      └─────┘│
├──────────────┤
│   Content    │
└──────────────┘
```

This visual guide shows exactly how your multilingual feature looks and works!
