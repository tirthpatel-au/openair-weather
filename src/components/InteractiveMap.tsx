import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { Sparkles } from 'lucide-react'
import { majorCities } from '../data/majorCities'

type ActiveLocation = {
  label: string
  shortName: string
  lat: number
  lon: number
}

type InteractiveMapProps = {
  activeLocation?: ActiveLocation
  disabled: boolean
  onSelect: (lat: number, lon: number) => void
}

const formatCoordinates = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`

const ClickHandler = ({
  disabled,
  onSelect,
}: {
  disabled: boolean
  onSelect: (lat: number, lon: number) => void
}) => {
  useMapEvents({
    click(event) {
      if (!disabled) {
        onSelect(event.latlng.lat, event.latlng.lng)
      }
    },
  })

  return null
}

const RecenterMap = ({ activeLocation }: { activeLocation?: ActiveLocation }) => {
  const map = useMap()

  if (activeLocation) {
    map.flyTo([activeLocation.lat, activeLocation.lon], Math.max(map.getZoom(), 5), {
      duration: 1.2,
    })
  }

  return null
}

export const InteractiveMap = ({ activeLocation, disabled, onSelect }: InteractiveMapProps) => (
  <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)] sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-soft)]">
          World explorer
        </p>
        <h3 className="mt-3 font-display text-3xl tracking-[-0.05em]">Zoom into any city</h3>
      </div>
      <div className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-soft)]">
        Scroll to zoom, drag to move, click to load weather
      </div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="overflow-hidden rounded-[1.7rem] border border-[var(--line)]">
        <MapContainer
          center={activeLocation ? [activeLocation.lat, activeLocation.lon] : [20, 0]}
          zoom={activeLocation ? 5 : 2}
          scrollWheelZoom
          className="h-[28rem] w-full"
          worldCopyJump
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler disabled={disabled} onSelect={onSelect} />
          <RecenterMap activeLocation={activeLocation} />

          {majorCities.map((city) => (
            <CircleMarker
              key={`${city.name}-${city.country}`}
              center={[city.lat, city.lon]}
              pathOptions={{
                color: '#ffffff',
                weight: 1,
                fillColor: '#1197be',
                fillOpacity: 0.85,
              }}
              radius={5}
              eventHandlers={{
                click: () => onSelect(city.lat, city.lon),
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                {city.name}
              </Tooltip>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{city.name}</div>
                  <div>{city.country}</div>
                  <div>{formatCoordinates(city.lat, city.lon)}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {activeLocation ? (
            <CircleMarker
              center={[activeLocation.lat, activeLocation.lon]}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#0a7ca0',
                fillOpacity: 1,
              }}
              radius={9}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
                {activeLocation.shortName}
              </Tooltip>
            </CircleMarker>
          ) : null}
        </MapContainer>
      </div>

      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--text-soft)]">
            Selected point
          </p>
          <p className="mt-3 font-display text-2xl tracking-[-0.04em]">
            {activeLocation?.shortName ?? 'Pick a place'}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
            {activeLocation
              ? formatCoordinates(activeLocation.lat, activeLocation.lon)
              : 'Use the map like a real world explorer: zoom in, move around, and click any point.'}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Sparkles size={18} />
            <span className="text-sm font-semibold">Map tools</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
            Country borders, city labels, and street-style tiles come from the live map layer, while
            OpenAir uses your click position to fetch weather for the exact area.
          </p>
        </div>
      </div>
    </div>
  </div>
)
