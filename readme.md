# Tasklytics

Tasklytics is a simple, yet powerful task management application. 

It's built as a fully static Progressive Web App (PWA), using IndexedDB for client-side storage. This means your data stays on your device, not on someone else server.

> ✨ **Try out Tasklytics now at** https://tasklytics.airoflare.com (hosted on Cloudflare Pages for free!)


<br />

## Screenshots

<details>
<summary><strong>Click to view</strong></summary>

<table>
  <tr>
    <td align="center">
      <img src="/images/light-1.png" alt="Light Mode 1" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-1.png" alt="Dark Mode 1" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/images/light-2.png" alt="Light Mode 2" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-2.png" alt="Dark Mode 2" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/images/light-3.png" alt="Light Mode 3" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-3.png" alt="Dark Mode 3" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/images/light-4.png" alt="Light Mode 4" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-4.png" alt="Dark Mode 4" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/images/light-5.png" alt="Light Mode 5" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-5.png" alt="Dark Mode 5" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/images/light-6.png" alt="Light Mode 6" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-6.png" alt="Dark Mode 6" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/images/light-7.png" alt="Light Mode 7" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-7.png" alt="Dark Mode 7" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/images/light-8.png" alt="Light Mode 8" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-8.png" alt="Dark Mode 8" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/images/light-9.png" alt="Light Mode 9" width="400" /><br/>
      Light Mode
    </td>
    <td align="center">
      <img src="/images/dark-9.png" alt="Dark Mode 9" width="400" /><br/>
      Dark Mode
    </td>
  </tr>
</table>
</details>

<br />

## Features
*   **Task Management:** Create, edit, and delete tasks with titles, descriptions, due dates, priorities, and tags.
*   **Multiple Views:** Visualize your tasks in a Kanban board or a traditional list view.
*   **Attachments:** Add and remove attachments (images, pdf, zip..) to tasks.
*   **Customization:**
    *   **Statuses:** Define your own workflow statuses (e.g., To Do, In Progress, Done).
    *   **Priorities:** Set custom priority levels for your tasks.
    *   **Tags:** Organize your tasks with custom tags.
*   **Internationalization:** Supports multiple languages (English, German, and Spanish).
*   **Theming:** Switch between light and dark themes.
*   **Timezone Support:** Display dates and times in your local timezone.
*   **PWA:** Installable on your device for an app-like experience.
*   **Data Management:** Easily back up your data and restore it on any device.


<br />

## How It Works

Tasklytics is built with [Next.js](https://nextjs.org) as a fully static site, meaning it doesn't rely on any server or backend. You can host it anywhere that supports static sites — like GitHub Pages, Cloudflare Pages, or Netlify.

All your data is stored locally in your browser using **IndexedDB**, a built-in database designed for web applications. This makes the app fast, responsive, and completely independent of external databases or cloud storage.

Since everything is saved on your device, your data stays private — no one else can access it. However, this also means your data is tied to the specific browser and device you're using. 

To move your data elsewhere, you can use the built-in **backup and restore** feature to transfer it to another browser or device.



<br />

## Why I Built This

I had been using GitHub Projects as a to-do list for a while, and before that, I tried Linear. GitHub lacks customization, while Linear offers more features than I actually need—plus, both require an account to use.

So, I decided to build my own web app tailored to the features I need. I made it open source so anyone can customize it and use it for their own workflow.

<br />

## How I Use It

I've installed Tasklytics on my Mac as a Progressive Web App (PWA).

I update my tasks daily—adding and removing them as needed, so it’s now completely replaced both GitHub Projects and Linear for my workflow.


<br />

## How to Deploy

Pick your favorite platform. It just works, no config, no env files.

### **Vercel (Free)**

1. Create a new project
2. Enter this repository link
3. Select Next.js as framework
4. Deploy!

### **Cloudflare Pages (Free)**

1. Create a new Pages project
2. Enter this repository link
3. Select Next.js as framework
4. Deploy!

### **Coolify**

1. Add a new resource → Docker Image
2. Use this image: `ghcr.io/airoflare/tasklytics:latest`
3. Deploy!

<br />

## ⚠️ Limitations

- **No sync across devices**
  - Your tasks are saved only in your current browser. If you switch devices or clear your browser data, you’ll lose them (we have backup and restore feature).

- **Desktop mode only**
  - The application won't work on mobile devices
  
<br />

## For Developers
To get started with development, you'll need to have [Node.js](https://nodejs.org/) and [bun](https://bun.sh/) installed.

```bash
# Clone the repo
git clone https://github.com/airoflare/tasklytics.git
cd tasklytics

# Install dependencies and run the dev server
bun install
bun run dev
# → Opens at http://localhost:3000

# Build the static site
bun run build
# → Output goes to the `out/` folder

# Note: Files inside `public/icons` and `public/screenshots` are required for PWA.
```

<br />

### Adding a New Language

To add a new language to the application, follow these steps:

1.  **Create a new translation file:**
    *   Create a new JSON file in the `language/` directory (e.g., `french.json`).
    *   Copy the contents of an existing language file (e.g., `english.json`) and translate the values.

2.  **Update the language context:**
    *   Open `lib/language-context.tsx`.
    *   Import your new translation file:
        ```tsx
        import frenchTranslations from "@/language/french.json";
        ```
    *   Add the language key to the `LanguageKey` type:
        ```tsx
        type LanguageKey = "en" | "de" | "es" | "fr";
        ```
    *   Add your translations to the `allTranslations` object:
        ```tsx
        const allTranslations = {
          en: englishTranslations,
          de: germanTranslations,
          es: spanishTranslations,
          fr: frenchTranslations,
        };
        ```

3.  **Add the language to the settings page:**
    *   Open `components/settings-content.tsx`.
    *   Add a new `SelectItem` to the language selection dropdown:
        ```tsx
        <SelectItem value="fr">{t("french")}</SelectItem>
        ```
    *   Make sure you add a corresponding `"french": "French"` key-value pair to all your language JSON files for this to display correctly.
    
    
<br />

## Note

I built this with [v0.dev](https://v0.dev) , [Gemini CLI](https://github.com/google-gemini/gemini-cli) and [ChatGPT](https://chat.com).

I don’t really know much about Next.js or React, so the codebase is kind of a mess — but it works!
