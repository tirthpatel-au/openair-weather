# OpenAir Weather Dashboard

OpenAir is a minimal weather dashboard built with React, TypeScript, Vite, Tailwind CSS, Axios, and the OpenWeather API. It lets you search cities, view current conditions, check a multi-day forecast, and switch between light and dark mode.

## Features

- Live city search with OpenWeather geocoding
- Current temperature, humidity, wind speed, and weather conditions
- 5-day forecast view based on OpenWeather free plan support
- Light-first minimal UI with dark mode toggle
- Loading skeletons for smoother data fetching
- Responsive layout for desktop and mobile

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- OpenWeather API

## Getting Started

### 1. Clone the project

```bash
git clone https://github.com/tirthpatel-au/openair-weather.git
cd openair-weather
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your OpenWeather API key

Create a `.env` file in the project root:

```env
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

You can get a key from [OpenWeather](https://home.openweathermap.org/api_keys).

### 4. Start the development server

```bash
npm run dev
```

Then open the local URL shown in your terminal, usually `http://localhost:5173`.

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Builds the app for production.

```bash
npm run preview
```

Previews the production build locally.

## Project Structure

```text
.
|-- public/
|-- src/
|   |-- App.tsx
|   |-- index.css
|   `-- main.tsx
|-- .env.example
|-- index.html
|-- package.json
`-- vite.config.ts
```

## Notes

- OpenWeather free accounts support current weather and 5-day forecast endpoints.
- Brand-new API keys can take a few minutes to activate.
- `.env` is ignored from Git so your real API key stays local.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
