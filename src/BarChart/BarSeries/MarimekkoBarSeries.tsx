import React, { Component } from 'react';
import { BarSeriesProps, BarSeries } from './BarSeries';
import { Bar } from './Bar';
import { RangeLines } from './RangeLines';
import { ChartTooltip, TooltipTemplate, TooltipArea } from '../../common/Tooltip';
import { formatValue } from '../../common/utils/formatting';
import { Gradient, GradientStop } from '../../common/Gradient';

export class MarimekkoBarSeries extends Component<BarSeriesProps> {
  static defaultProps: Partial<BarSeriesProps> = {
    ...BarSeries.defaultProps,
    type: 'marimekko',
    padding: 10,
    tooltip: (
      <TooltipArea
        tooltip={
          <ChartTooltip
            followCursor={true}
            modifiers={{
              offset: '5px, 5px'
            }}
            content={(point, color) => {
              const data = {
                ...point,
                data: point.data.map(d => ({
                  ...d,
                  value: `${formatValue(d.value)} ∙ ${formatValue(
                    Math.floor((d.y1 - d.y0) * 100)
                  )}%`
                }))
              };

              return <TooltipTemplate value={data} color={color} />;
            }}
          />
        }
      />
    ),
    bar: (
      <Bar
        rounded={false}
        padding={10}
        gradient={
          <Gradient
            stops={[
              <GradientStop offset="5%" stopOpacity={0.1} key="start" />,
              <GradientStop offset="90%" stopOpacity={0.7} key="stop" />
            ]}
          />
        }
        rangeLines={<RangeLines position="top" strokeWidth={3} />}
      />
    )
  };

  render() {
    const { type, ...rest } = this.props;
    return <BarSeries type="marimekko" {...rest} />;
  }
}
