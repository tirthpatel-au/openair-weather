import axios from 'axios'
import {
  CloudSun,
  Droplets,
  LoaderCircle,
  MapPin,
  MoonStar,
  Search,
  SunMedium,
  Wind,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type Theme = 'light' | 'dark'

type Coordinates = {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

type WeatherDescriptor = {
  description: string
  icon: string
  main: string
}

type ForecastDay = {
  dt: number
  humidity: number
  temp: {
    min: number
    max: number
  }
  weather: WeatherDescriptor[]
}

type WeatherState = {
  location: Coordinates
  timezoneLabel: string
  current: {
    temp: number
    humidity: number
    wind_speed: number
    weather: WeatherDescriptor[]
  }
  forecast: ForecastDay[]
}

type CurrentApiResponse = {
  timezone: number
  main: {
    temp: number
    humidity: number
  }
  wind: {
    speed: number
  }
  weather: WeatherDescriptor[]
}

type ForecastListItem = {
  dt: number
  dt_txt: string
  main: {
    temp_min: number
    temp_max: number
    humidity: number
  }
  weather: WeatherDescriptor[]
}

type ForecastApiResponse = {
  list: ForecastListItem[]
}

type MetricCardProps = {
  icon: React.ReactNode
  label: string
  value: string
}

const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
const storageKey = 'openair-theme'

const featuredCities = ['Brisbane', 'Tokyo', 'London', 'New York']

const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

const timezoneFormatter = new Intl.DateTimeFormat('en-US', {
  timeZoneName: 'short',
})

const createThemePreference = (): Theme => {
  const savedTheme = window.localStorage.getItem(storageKey)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getWeatherIcon = (iconCode: string) =>
  `https://openweathermap.org/img/wn/${iconCode}@2x.png`

const formatLocation = ({ name, state, country }: Coordinates) =>
  [name, state, country].filter(Boolean).join(', ')

const toTimezoneLabel = (offsetInSeconds: number) => {
  const baseDate = new Date(Date.now() + offsetInSeconds * 1000)
  const parts = timezoneFormatter.formatToParts(baseDate)

  return parts.find((part) => part.type === 'timeZoneName')?.value ?? `UTC ${offsetInSeconds / 3600}`
}

const groupForecastByDay = (items: ForecastListItem[]) => {
  const grouped = new Map<string, ForecastListItem[]>()

  items.forEach((item) => {
    const key = item.dt_txt.slice(0, 10)
    const dayItems = grouped.get(key) ?? []
    dayItems.push(item)
    grouped.set(key, dayItems)
  })

  return Array.from(grouped.values())
    .slice(0, 5)
    .map((dayItems) => {
      const representative =
        dayItems.find((entry) => entry.dt_txt.includes('12:00:00')) ??
        dayItems[Math.floor(dayItems.length / 2)]

      return {
        dt: representative.dt,
        humidity: representative.main.humidity,
        temp: {
          min: Math.min(...dayItems.map((entry) => entry.main.temp_min)),
          max: Math.max(...dayItems.map((entry) => entry.main.temp_max)),
        },
        weather: representative.weather,
      }
    })
}

const MetricCard = ({ icon, label, value }: MetricCardProps) => (
  <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)] p-4">
    <div className="flex items-center gap-2 text-[var(--accent)]">{icon}</div>
    <p className="mt-4 text-sm text-[var(--text-soft)]">{label}</p>
    <p className="mt-1 text-lg font-semibold">{value}</p>
  </div>
)

const CurrentWeatherSkeleton = () => (
  <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <div className="animate-pulse rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)] sm:p-8">
      <div className="h-4 w-40 rounded-full bg-[var(--skeleton)]" />
      <div className="mt-5 h-20 w-44 rounded-[1.5rem] bg-[var(--skeleton)]" />
      <div className="mt-4 h-6 w-56 rounded-full bg-[var(--skeleton)]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-28 rounded-[1.4rem] bg-[var(--skeleton)]" />
        ))}
      </div>
    </div>
    <div className="animate-pulse rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)] sm:p-8">
      <div className="h-4 w-32 rounded-full bg-[var(--skeleton)]" />
      <div className="mt-5 h-10 w-40 rounded-full bg-[var(--skeleton)]" />
      <div className="mt-4 h-4 w-full rounded-full bg-[var(--skeleton)]" />
      <div className="mt-2 h-4 w-5/6 rounded-full bg-[var(--skeleton)]" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-20 rounded-[1.25rem] bg-[var(--skeleton)]" />
        ))}
      </div>
    </div>
  </section>
)

const ForecastSkeleton = () => (
  <div className="animate-pulse rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-2">
        <div className="h-4 w-16 rounded-full bg-[var(--skeleton)]" />
        <div className="h-3 w-20 rounded-full bg-[var(--skeleton)]" />
      </div>
      <div className="h-11 w-11 rounded-full bg-[var(--skeleton)]" />
      <div className="space-y-2">
        <div className="h-4 w-12 rounded-full bg-[var(--skeleton)]" />
        <div className="h-3 w-10 rounded-full bg-[var(--skeleton)]" />
      </div>
    </div>
  </div>
)

const OpenAirLogo = () => (
  <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[var(--accent-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
    <svg viewBox="0 0 84 84" className="h-11 w-11 text-[var(--accent)]" fill="none">
      <path
        d="M14 45H44.5C50.299 45 55 40.299 55 34.5C55 29.253 50.747 25 45.5 25C44.491 25 43.52 25.157 42.609 25.449C40.56 20.483 35.67 17 29.968 17C22.418 17 16.166 23.09 15.906 30.635C10.804 31.569 7 35.993 7 41.364C7 47.407 11.9 52.307 17.943 52.307H53"
        stroke="currentColor"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 28C52 19.716 58.716 13 67 13"
        stroke="currentColor"
        strokeWidth="4.8"
        strokeLinecap="round"
      />
      <path d="M63 7V1" stroke="currentColor" strokeWidth="4.8" strokeLinecap="round" />
      <path d="M73 11L77 7" stroke="currentColor" strokeWidth="4.8" strokeLinecap="round" />
      <path d="M77 21H83" stroke="currentColor" strokeWidth="4.8" strokeLinecap="round" />
      <path
        d="M18 58H49C58.389 58 66 50.389 66 41V31L77 42"
        stroke="currentColor"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M30 66L26 73" stroke="currentColor" strokeWidth="4.8" strokeLinecap="round" />
      <path d="M42 66L38 73" stroke="currentColor" strokeWidth="4.8" strokeLinecap="round" />
    </svg>
  </div>
)

const App = () => {
  const [theme, setTheme] = useState<Theme>('light')
  const [query, setQuery] = useState('Brisbane')
  const [weather, setWeather] = useState<WeatherState | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTheme(createThemePreference())
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(storageKey, theme)
  }, [theme])

  const fetchWeather = async (city: string, mode: 'initial' | 'search' = 'search') => {
    if (!apiKey) {
      setError('Add your OpenWeather API key in VITE_OPENWEATHER_API_KEY to load live weather.')
      setLoading(false)
      setSearching(false)
      return
    }

    if (mode === 'initial') {
      setLoading(true)
    } else {
      setSearching(true)
    }

    setError(null)

    try {
      const geocodeResponse = await axios.get<Coordinates[]>(
        'https://api.openweathermap.org/geo/1.0/direct',
        {
          params: {
            q: city,
            limit: 1,
            appid: apiKey,
          },
        },
      )

      const location = geocodeResponse.data[0]

      if (!location) {
        throw new Error('City not found. Try a larger city name or include a country.')
      }

      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get<CurrentApiResponse>('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            lat: location.lat,
            lon: location.lon,
            units: 'metric',
            appid: apiKey,
          },
        }),
        axios.get<ForecastApiResponse>('https://api.openweathermap.org/data/2.5/forecast', {
          params: {
            lat: location.lat,
            lon: location.lon,
            units: 'metric',
            appid: apiKey,
          },
        }),
      ])

      setWeather({
        location,
        timezoneLabel: toTimezoneLabel(currentResponse.data.timezone),
        current: {
          temp: currentResponse.data.main.temp,
          humidity: currentResponse.data.main.humidity,
          wind_speed: currentResponse.data.wind.speed,
          weather: currentResponse.data.weather,
        },
        forecast: groupForecastByDay(forecastResponse.data.list),
      })
      setQuery(location.name)
    } catch (requestError) {
      if (
        axios.isAxiosError(requestError) &&
        (requestError.response?.status === 401 || requestError.response?.status === 403)
      ) {
        setError(
          'OpenWeather rejected the request. If this key is brand new, wait a few minutes for activation and try again.',
        )
      } else if (requestError instanceof Error) {
        setError(requestError.message)
      } else {
        setError('Something went wrong while loading the weather.')
      }
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  useEffect(() => {
    void fetchWeather('Brisbane', 'initial')
  }, [])

  const currentWeather = weather?.current
  const forecast = useMemo(() => weather?.forecast ?? [], [weather])
  const isBusy = loading || searching

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const city = query.trim()
    if (!city) {
      setError('Enter a city name to search live weather.')
      return
    }

    await fetchWeather(city)
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] transition-colors duration-500">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-[var(--line)] bg-[var(--panel)]/88 p-5 shadow-[var(--panel-shadow)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <OpenAirLogo />
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-[var(--text-soft)]">
                OpenAir
              </p>
              <h1 className="font-display text-2xl tracking-[-0.04em] sm:text-3xl">
                Your Daily Forecast
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-2 md:self-auto">
            <button
              type="button"
              aria-label="Switch theme"
              onClick={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] transition-transform duration-300 hover:scale-105"
            >
              {theme === 'light' ? <MoonStar size={20} /> : <SunMedium size={20} />}
            </button>
            <span className="pr-3 text-sm text-[var(--text-soft)]">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </span>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--hero-bg)] p-6 shadow-[var(--panel-shadow)] sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(76,181,214,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(120,180,255,0.12),_transparent_30%)]" />
              <div className="relative">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
                      Live conditions
                    </span>
                    <h2 className="mt-4 font-display text-4xl tracking-[-0.06em] sm:text-5xl">
                      Minimal weather, in real time.
                    </h2>
                    <p className="mt-4 max-w-lg text-base leading-7 text-[var(--text-soft)]">
                      Search any city, check the current temperature instantly, and scan a clean
                      daily forecast without digging through clutter.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-soft)]">
                    <CloudSun size={18} className="text-[var(--accent)]" />
                    {weather?.timezoneLabel ?? 'Waiting for live data'}
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)]/95 p-3 sm:flex-row"
                >
                  <label className="flex flex-1 items-center gap-3 rounded-[1.2rem] px-3 py-3">
                    <Search size={18} className="text-[var(--text-soft)]" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search city, for example Sydney"
                      className="w-full bg-transparent text-base outline-none placeholder:text-[var(--text-faint)]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="inline-flex min-w-36 items-center justify-center gap-2 rounded-[1.2rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isBusy ? <LoaderCircle size={18} className="animate-spin" /> : <Search size={18} />}
                    {isBusy ? 'Loading...' : 'Search weather'}
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap gap-3">
                  {featuredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setQuery(city)
                        void fetchWeather(city)
                      }}
                      className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-soft)] transition duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {error ? (
              <section className="rounded-[2rem] border border-[var(--danger-line)] bg-[var(--danger-bg)] p-6 text-[var(--danger-text)] shadow-[var(--panel-shadow)]">
                <h3 className="font-display text-2xl tracking-[-0.04em]">Live weather is waiting</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7">{error}</p>
                {!apiKey ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                    Create a `.env` file with `VITE_OPENWEATHER_API_KEY=your_key_here`, then run the
                    app again.
                  </p>
                ) : null}
              </section>
            ) : null}

            {loading ? (
              <CurrentWeatherSkeleton />
            ) : currentWeather && weather ? (
              <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)] sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-soft)]">
                        <MapPin size={16} />
                        {formatLocation(weather.location)}
                      </div>
                      <h3 className="mt-4 font-display text-6xl tracking-[-0.08em] sm:text-7xl">
                        {Math.round(currentWeather.temp)}&deg;
                      </h3>
                      <p className="mt-3 text-lg capitalize text-[var(--text-soft)]">
                        {currentWeather.weather[0]?.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-center rounded-[1.5rem] bg-[var(--accent-soft)] px-5 py-4">
                      <img
                        src={getWeatherIcon(currentWeather.weather[0]?.icon ?? '01d')}
                        alt={currentWeather.weather[0]?.main ?? 'Weather icon'}
                        className="h-24 w-24"
                      />
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <MetricCard
                      icon={<Droplets size={18} />}
                      label="Humidity"
                      value={`${currentWeather.humidity}%`}
                    />
                    <MetricCard
                      icon={<Wind size={18} />}
                      label="Wind speed"
                      value={`${Math.round(currentWeather.wind_speed)} m/s`}
                    />
                    <MetricCard
                      icon={<CloudSun size={18} />}
                      label="Condition"
                      value={currentWeather.weather[0]?.main ?? 'Clear'}
                    />
                  </div>
                </article>

                <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-soft)]">
                    Forecast snapshot
                  </p>
                  <h3 className="mt-4 font-display text-3xl tracking-[-0.05em]">
                    The days ahead
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                    OpenWeather free plans provide current weather plus a 5-day forecast, so this view
                    stays fully compatible with your key.
                  </p>

                  <div className="mt-6 space-y-3">
                    {forecast.slice(0, 3).map((day) => (
                      <div
                        key={day.dt}
                        className="flex items-center justify-between rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold">{dayFormatter.format(day.dt * 1000)}</p>
                          <p className="text-sm text-[var(--text-soft)]">
                            {dateFormatter.format(day.dt * 1000)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <img
                            src={getWeatherIcon(day.weather[0]?.icon ?? '01d')}
                            alt={day.weather[0]?.main ?? 'Forecast icon'}
                            className="h-12 w-12"
                          />
                          <div className="text-right">
                            <p className="font-semibold">
                              {Math.round(day.temp.max)}&deg; / {Math.round(day.temp.min)}&deg;
                            </p>
                            <p className="text-sm capitalize text-[var(--text-soft)]">
                              {day.weather[0]?.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            ) : null}
          </div>

          <aside className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-soft)]">
                  5-day forecast
                </p>
                <h2 className="mt-3 font-display text-3xl tracking-[-0.05em]">Daily outlook</h2>
              </div>
              {searching ? <LoaderCircle size={20} className="animate-spin text-[var(--accent)]" /> : null}
            </div>

            <div className="mt-6 space-y-3">
              {loading
                ? Array.from({ length: 5 }, (_, index) => <ForecastSkeleton key={index} />)
                : forecast.map((day) => (
                    <article
                      key={day.dt}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition duration-300 hover:-translate-y-0.5"
                    >
                      <div>
                        <p className="font-semibold">{dayFormatter.format(day.dt * 1000)}</p>
                        <p className="text-sm text-[var(--text-soft)]">
                          {dateFormatter.format(day.dt * 1000)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={getWeatherIcon(day.weather[0]?.icon ?? '01d')}
                          alt={day.weather[0]?.main ?? 'Forecast icon'}
                          className="h-11 w-11"
                        />
                        <span className="hidden text-sm capitalize text-[var(--text-soft)] sm:inline">
                          {day.weather[0]?.description}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{Math.round(day.temp.max)}&deg;</p>
                        <p className="text-sm text-[var(--text-soft)]">{Math.round(day.temp.min)}&deg;</p>
                      </div>
                    </article>
                  ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App
