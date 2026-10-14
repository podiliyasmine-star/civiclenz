import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Issue } from '../../lib/database.types'
import { CATEGORY_COLORS, CATEGORY_ICONS, STATUS_LABELS, timeAgo } from '../../utils/helpers'
import { useEffect } from 'react'

// Fix Leaflet default icon in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createCategoryIcon(category: string, status: string) {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? '#6b7280'
  const emoji = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? '📋'
  const opacity = status === 'resolved' ? '0.5' : '1'

  return L.divIcon({
    html: `
      <div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        opacity:${opacity};
      ">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span>
      </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

// Fly to location helper
interface FlyToProps {
  lat: number
  lng: number
  zoom?: number
}
function FlyTo({ lat, lng, zoom = 15 }: FlyToProps) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.5 })
  }, [lat, lng, zoom, map])
  return null
}

interface IssueMapProps {
  issues: Issue[]
  center?: [number, number]
  zoom?: number
  flyTo?: { lat: number; lng: number }
  height?: string
  onIssueClick?: (issue: Issue) => void
  showUserMarker?: boolean
  userPosition?: { lat: number; lng: number }
}

export function IssueMap({
  issues,
  center = [20.5937, 78.9629], // Default: India
  zoom = 5,
  flyTo,
  height = '100%',
  onIssueClick,
  showUserMarker = false,
  userPosition,
}: IssueMapProps) {
  const userIcon = L.divIcon({
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:#3b82f6;
      border:3px solid white;
      box-shadow:0 0 0 4px rgba(59,130,246,0.3);
    "></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {flyTo && <FlyTo lat={flyTo.lat} lng={flyTo.lng} />}

        {showUserMarker && userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-blue-600">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={createCategoryIcon(issue.category, issue.status)}
            eventHandlers={{
              click: () => onIssueClick?.(issue),
            }}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>
                    {CATEGORY_ICONS[issue.category as keyof typeof CATEGORY_ICONS]}
                  </span>
                  <div>
                    <p style={{ fontWeight: 600, color: '#f8fafc', margin: 0, fontSize: 13 }}>
                      {issue.title}
                    </p>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: 11 }}>
                      {timeAgo(issue.created_at)}
                    </p>
                  </div>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>
                  {issue.description.slice(0, 80)}...
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(59,130,246,0.2)', color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.3)'
                  }}>
                    {STATUS_LABELS[issue.status]}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
