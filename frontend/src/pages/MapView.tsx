import { MapContainer, TileLayer } from 'react-leaflet'

export default function Map() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={[-36.8485, 174.7633]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=YOUR_API_KEY`}
          attribution="Geoapify"
        />
      </MapContainer>
    </div>
  )
}