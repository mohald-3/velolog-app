import { Fragment, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import type { RideTrendBucket } from '../../../domain/ride-trends';
import type { UnitSystem } from '../../../domain/types';
import { formatDistance, metersToDistanceUnit } from '../../../domain/units';
import { useTheme } from '../../../theme/useTheme';

export function DistanceChart({
  buckets,
  unitSystem,
  labelFor,
}: {
  buckets: RideTrendBucket[];
  unitSystem: UnitSystem;
  labelFor: (bucket: RideTrendBucket) => string;
}) {
  const { colors } = useTheme();
  const width = 360;
  const height = 190;
  const chartHeight = 140;
  const gap = 8;
  const barWidth = (width - gap * (buckets.length + 1)) / Math.max(1, buckets.length);
  const max = Math.max(1, ...buckets.map((bucket) => metersToDistanceUnit(bucket.distanceM, unitSystem)));
  const accessibilityLabel = useMemo(
    () => buckets.map((bucket) => `${labelFor(bucket)}: ${formatDistance(bucket.distanceM, unitSystem)}`).join(', '),
    [buckets, labelFor, unitSystem]
  );

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} accessibilityElementsHidden>
        {buckets.map((bucket, index) => {
          const value = metersToDistanceUnit(bucket.distanceM, unitSystem);
          const barHeight = value === 0 ? 2 : (value / max) * chartHeight;
          const x = gap + index * (barWidth + gap);
          return (
            <Fragment key={bucket.start.toISOString()}>
              <Rect x={x} y={chartHeight - barHeight} width={barWidth} height={barHeight} rx={3} fill={colors.primary} />
              <SvgText x={x + barWidth / 2} y={chartHeight + 18} fill={colors.textMuted} fontSize={10} textAnchor="middle">
                {labelFor(bucket)}
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
