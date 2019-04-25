import React, { Fragment, Component, createRef } from 'react';
import chroma from 'chroma-js';
import { ChartTooltip, ChartTooltipProps } from '../../common/TooltipArea';
import { Gradient, GradientProps } from '../../common/Styles';
import classNames from 'classnames';
import { ChartInternalShallowDataShape } from '../../common/data';
import { RangeLinesProps } from './RangeLines';
import bind from 'memoize-bind';
import * as css from './Bar.module.scss';
import { PosedBar } from './PosedBar';
import { CloneElement } from '../../common/utils/children';

export interface BarProps {
  xScale: any;
  xScale1: any;
  data: ChartInternalShallowDataShape;
  id: string;
  gradient: JSX.Element | null;
  yScale: any;
  width: number;
  padding: number;
  barCount: number;
  color: any;
  rounded: boolean;
  cursor: string;
  barIndex: number;
  groupIndex?: number;
  animated: boolean;
  isCategorical: boolean;
  onClick: (event) => void;
  onMouseEnter: (event) => void;
  onMouseLeave: (event) => void;
  rangeLines: JSX.Element | null;
  tooltip: JSX.Element | null;
  layout: 'vertical' | 'horizontal';
}

interface BarState {
  active?: boolean;
}

interface BarCoordinates {
  width: number;
  height: number;
  x: number;
  y: number;
}

// Set padding modifier for the tooltips
const modifiers = {
  offset: {
    offset: '0, 5px'
  }
};

export class Bar extends Component<BarProps, BarState> {
  static defaultProps: Partial<BarProps> = {
    rounded: true,
    cursor: 'auto',
    tooltip: <ChartTooltip />,
    rangeLines: null,
    gradient: <Gradient />,
    onClick: () => undefined,
    onMouseEnter: () => undefined,
    onMouseLeave: () => undefined,
    layout: 'vertical'
  };

  rect = createRef<SVGGElement>();
  state: BarState = {};

  getXAttribute(): 'x' | 'x0' {
    return this.props.isCategorical ? 'x' : 'x0';
  }

  getExit({ x, width }: BarCoordinates) {
    const { yScale } = this.props;

    return {
      x,
      y: Math.max(...yScale.range()),
      height: 0,
      width
    };
  }

  getKeyCoords(v, v0, v1, scale, sizeOverride, isCategorical, padding) {
    let offset;
    let size;

    if (isCategorical) {
      if (scale.bandwidth) {
        offset = scale(v);
        size = scale.bandwidth();

        if (sizeOverride) {
          offset = offset + size / 2 - sizeOverride / 2;
          size = sizeOverride;
        }
      } else {
        if (sizeOverride) {
          throw new Error('Not a valid option for this scale type');
        }

        offset = scale(v0);
        size = scale((v1 as any) - (v0 as any));

        if (padding) {
          const calc = this.calculateLinearScalePadding(scale, offset, size);
          offset = calc.offset;
          size = calc.size;
        }
      }
    } else {
      if (sizeOverride) {
        throw new Error('Not a valid option for this scale type');
      }

      const c0 = scale(v0);
      const c1 = scale(v1);
      const delta = c1 - c0;
      offset = c0;
      size = Math.max(delta - 1, 0);
    }

    return { offset, size };
  }

  getValueCoords(v0, v1, scale) {
    const c0 = scale(v0);
    const c1 = scale(v1);
    const size = Math.abs(c0 - c1);
    return { offset: Math.min(c0, c1), size };
  }

  getCoords(): BarCoordinates {
    const { yScale, isCategorical, data, width, padding, layout } = this.props;
    const xScale = this.props.xScale1 || this.props.xScale;

    if (layout === 'vertical') {
      const xCoords = this.getKeyCoords(
        data.x,
        data.x0,
        data.x1,
        xScale,
        width,
        isCategorical,
        padding
      );
      const yCoords = this.getValueCoords(data.y0, data.y1, yScale);

      return {
        x: xCoords.offset,
        width: xCoords.size,
        y: yCoords.offset,
        height: yCoords.size
      };
    } else {
      const yCoords = this.getKeyCoords(
        data.y,
        data.y0,
        data.y1,
        yScale,
        width,
        isCategorical,
        padding
      );
      const xCoords = this.getValueCoords(data.x0, data.x1, xScale);

      return {
        x: xCoords.offset,
        width: xCoords.size,
        y: yCoords.offset,
        height: yCoords.size
      };
    }
  }

  /**
   * This function calculates the padding on a linear scale used by the marimekko chart.
   */
  calculateLinearScalePadding(scale, offset: number, size: number) {
    const { barCount, groupIndex, padding } = this.props;

    const totalSize = scale.range()[1];
    const sizeMinusPadding = totalSize - padding * (barCount - 1);
    const multiplier = sizeMinusPadding / totalSize;
    offset = offset * multiplier + groupIndex! * padding;
    size = size * multiplier;

    return { size, offset };
  }

  onMouseEnter(event: MouseEvent) {
    this.setState({ active: true });

    const { onMouseEnter, data } = this.props;
    onMouseEnter({
      value: data,
      nativeEvent: event
    });
  }

  onMouseLeave(event: MouseEvent) {
    this.setState({ active: false });

    const { onMouseLeave, data } = this.props;
    onMouseLeave({
      value: data,
      nativeEvent: event
    });
  }

  onMouseClick(event: MouseEvent) {
    const { onClick, data } = this.props;
    onClick({
      value: data,
      nativeEvent: event
    });
  }

  getFill(color: string) {
    const { id, gradient } = this.props;

    if (!gradient) {
      return color;
    }

    return `url(#${id}-gradient)`;
  }

  getTooltipData() {
    const { data } = this.props;

    const xAttr = this.getXAttribute();
    let x = data[xAttr]!;
    if (data.key && data.key !== x) {
      x = `${data.key} ∙ ${x}`;
    }

    return { y: data.y, x };
  }

  renderBar(currentColorShade: string, coords: BarCoordinates, index: number) {
    const { rounded, cursor, barCount, animated } = this.props;
    const fill = this.getFill(currentColorShade);
    const enterProps = coords;
    const exitProps = this.getExit(coords);

    return (
      <PosedBar
        pose="enter"
        poseKey={`${coords.x}-${coords.y}-${coords.height}-${coords.width}`}
        ref={this.rect}
        style={{ cursor }}
        fill={fill}
        onMouseEnter={bind(this.onMouseEnter, this)}
        onMouseLeave={bind(this.onMouseLeave, this)}
        onClick={bind(this.onMouseClick, this)}
        className={classNames({ [css.rounded]: rounded })}
        enterProps={enterProps}
        exitProps={exitProps}
        index={index}
        barCount={barCount}
        animated={animated}
      />
    );
  }

  render() {
    const {
      id,
      gradient,
      data,
      barIndex,
      color,
      yScale,
      barCount,
      tooltip,
      groupIndex,
      rangeLines,
      animated
    } = this.props;
    const { active } = this.state;
    const stroke = color(data, barIndex);
    const coords = this.getCoords();
    const currentColorShade = active ? chroma(stroke).brighten(0.5) : stroke;
    const index = groupIndex !== undefined ? groupIndex : barIndex;

    return (
      <Fragment>
        {this.renderBar(currentColorShade, coords, index)}
        {rangeLines && (
          <CloneElement<RangeLinesProps>
            element={rangeLines}
            {...coords}
            index={index}
            data={data}
            yScale={yScale}
            color={currentColorShade}
            barCount={barCount}
            animated={animated}
          />
        )}
        {tooltip && !tooltip.props.disabled && (
          <CloneElement<ChartTooltipProps>
            element={tooltip}
            visible={!!active}
            modifiers={modifiers}
            reference={this.rect}
            color={color}
            value={this.getTooltipData()}
            metadata={data}
          />
        )}
        {gradient && (
          <CloneElement<GradientProps>
            element={gradient}
            id={`${id}-gradient`}
            color={currentColorShade}
          />
        )}
      </Fragment>
    );
  }
}
