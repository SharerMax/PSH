import world from '@svg-maps/world'

interface CountryMapProps {
  /** country ISO alpha-2 code (uppercase) -> view count */
  counts: Record<string, number>
}

/**
 * World map choropleth: countries with view counts are tinted by intensity.
 *
 * Map geometry from @svg-maps/world (https://github.com/VictorCazanave/svg-maps),
 * licensed under CC BY 4.0. Attribution is displayed in the UI via `stats.mapCredit`.
 */
export function CountryMap({ counts }: CountryMapProps) {
  const max = Math.max(...Object.values(counts), 1)

  return (
    <svg viewBox={world.viewBox} className="h-auto w-full" role="img">
      {world.locations.map((location) => {
        const count = counts[location.id.toUpperCase()] ?? 0
        const fillOpacity = count === 0 ? undefined : 0.25 + 0.75 * (count / max)
        return (
          <path
            key={location.id}
            d={location.path}
            fill={count === 0 ? 'var(--muted)' : 'var(--primary)'}
            fillOpacity={fillOpacity}
            stroke="var(--background)"
            strokeWidth={0.5}
          >
            <title>
              {location.name}
              {count > 0 ? ` · ${count}` : ''}
            </title>
          </path>
        )
      })}
    </svg>
  )
}
