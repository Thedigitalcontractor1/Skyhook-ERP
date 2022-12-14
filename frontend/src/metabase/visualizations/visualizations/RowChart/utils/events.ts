import _ from "underscore";
import {
  DatasetColumn,
  RowValue,
  VisualizationSettings,
} from "metabase-types/api";
import { isNotNull } from "metabase/core/utils/types";
import { formatNullable } from "metabase/lib/formatting/nullable";
import {
  ChartColumns,
  ColumnDescriptor,
  getColumnDescriptors,
} from "metabase/visualizations/lib/graph/columns";
import {
  BarData,
  Series,
} from "metabase/visualizations/shared/components/RowChart/types";
import {
  GroupedDatum,
  MetricDatum,
  SeriesInfo,
} from "metabase/visualizations/shared/types/data";
import { sumMetric } from "metabase/visualizations/shared/utils/data";
import { formatValueForTooltip } from "metabase/visualizations/lib/tooltip";
import { TooltipRowModel } from "metabase/visualizations/components/ChartTooltip/types";
import { isMetric } from "metabase-lib/types/utils/isa";

const getMetricColumnData = (
  columns: DatasetColumn[],
  metricDatum: MetricDatum,
) => {
  return Object.entries(metricDatum).map(([columnName, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const col = columns.find(column => column.name === columnName)!;

    return {
      key: col.display_name,
      value: formatNullable(value),
      col,
    };
  });
};

const getColumnData = (columns: ColumnDescriptor[], datum: GroupedDatum) => {
  return columns
    .map(columnDescriptor => {
      const { column, index } = columnDescriptor;

      let value = null;

      if (isMetric(column)) {
        const metricSum = datum.rawRows.reduce<number | null>(
          (acc, currentRow) => sumMetric(acc, currentRow[index]),
          null,
        );

        value = formatNullable(metricSum);
      } else {
        const distinctValues = new Set(datum.rawRows.map(row => row[index]));
        value = distinctValues.size === 1 ? datum.rawRows[0][index] : null;
      }

      return value != null
        ? {
            key: column.display_name,
            value: formatNullable(value),
            col: column,
          }
        : null;
    })
    .filter(isNotNull);
};

const getColumnsData = (
  chartColumns: ChartColumns,
  series: Series<GroupedDatum, unknown>,
  datum: GroupedDatum,
  datasetColumns: DatasetColumn[],
) => {
  const data = [
    {
      key: chartColumns.dimension.column.display_name,
      value: formatNullable(datum.dimensionValue),
      col: chartColumns.dimension.column,
    },
  ];

  let metricDatum: MetricDatum;

  if ("breakout" in chartColumns && datum.breakout) {
    data.push({
      key: chartColumns.breakout.column.display_name,
      value: series.seriesKey,
      col: chartColumns.breakout.column,
    });

    metricDatum = datum.breakout[series.seriesKey].metrics;
  } else {
    metricDatum = datum.metrics;
  }

  data.push(...getMetricColumnData(datasetColumns, metricDatum));

  const otherColumnsDescriptiors = getColumnDescriptors(
    datasetColumns
      .filter(column => !data.some(item => item.col === column))
      .map(column => column.name),
    datasetColumns,
  );

  data.push(...getColumnData(otherColumnsDescriptiors, datum));
  return data;
};

export const getClickData = (
  bar: BarData<GroupedDatum, SeriesInfo>,
  visualizationSettings: VisualizationSettings,
  chartColumns: ChartColumns,
  datasetColumns: DatasetColumn[],
) => {
  const { series, datum } = bar;
  const data = getColumnsData(chartColumns, series, datum, datasetColumns);

  const xValue = series.xAccessor(datum);
  const yValue = series.yAccessor(datum);

  const dimensions: { column: DatasetColumn; value?: RowValue }[] = [
    {
      column: chartColumns.dimension.column,
      value: yValue,
    },
  ];

  if ("breakout" in chartColumns) {
    dimensions.push({
      column: chartColumns.breakout.column,
      value: series.seriesInfo?.breakoutValue,
    });
  }

  return {
    value: xValue,
    column: series.seriesInfo?.metricColumn,
    dimensions,
    data,
    settings: visualizationSettings,
  };
};

export const getLegendClickData = (
  seriesIndex: number,
  series: Series<GroupedDatum, SeriesInfo>[],
  visualizationSettings: VisualizationSettings,
  chartColumns: ChartColumns,
) => {
  const currentSeries = series[seriesIndex];

  const dimensions =
    "breakout" in chartColumns
      ? {
          column: chartColumns.breakout.column,
          value: currentSeries.seriesInfo?.breakoutValue,
        }
      : undefined;

  return {
    column: currentSeries.seriesInfo?.metricColumn,
    dimensions,
    settings: visualizationSettings,
  };
};

const getBreakoutsTooltipRows = <TDatum>(
  bar: BarData<TDatum>,
  settings: VisualizationSettings,
  multipleSeries: Series<TDatum, SeriesInfo>[],
  seriesColors: Record<string, string>,
): TooltipRowModel[] =>
  multipleSeries.map(series => {
    const value = series.xAccessor(bar.datum);
    return {
      name: series.seriesName,
      color: seriesColors[series.seriesKey],
      value,
      formatter: value =>
        String(
          formatValueForTooltip({
            value,
            settings,
            column: series.seriesInfo?.metricColumn,
          }),
        ),
    };
  });

const getMultipleMetricsTooltipRows = <TDatum>(
  bar: BarData<TDatum>,
  settings: VisualizationSettings,
  multipleSeries: Series<TDatum, SeriesInfo>[],
  seriesColors: Record<string, string>,
): TooltipRowModel[] =>
  multipleSeries.map(series => {
    const value = series.xAccessor(bar.datum);

    return {
      name: series.seriesName,
      color: seriesColors[series.seriesKey],
      value,
      formatter: value =>
        String(
          formatValueForTooltip({
            value,
            settings,
            column: series.seriesInfo?.metricColumn,
          }),
        ),
    };
  });

const getTooltipModel = <TDatum>(
  bar: BarData<TDatum>,
  settings: VisualizationSettings,
  chartColumns: ChartColumns,
  multipleSeries: Series<TDatum, SeriesInfo>[],
  seriesColors: Record<string, string>,
) => {
  const { series, datum } = bar;
  const dimensionValue = series.yAccessor(datum);

  const headerTitle = String(
    formatValueForTooltip({
      value: dimensionValue,
      column: chartColumns.dimension.column,
      settings,
    }),
  );

  const hasBreakout = "breakout" in chartColumns;

  const rows = hasBreakout
    ? getBreakoutsTooltipRows(bar, settings, multipleSeries, seriesColors)
    : getMultipleMetricsTooltipRows(
        bar,
        settings,
        multipleSeries,
        seriesColors,
      );

  const [headerRows, bodyRows] = _.partition(
    rows,
    row => row.name === series.seriesName,
  );

  const totalFormatter = hasBreakout
    ? (value: unknown) =>
        String(
          formatValueForTooltip({
            value,
            settings,
            column: chartColumns.metric.column,
          }),
        )
    : undefined;

  return {
    headerTitle,
    headerRows,
    bodyRows,
    totalFormatter,
    showTotal: hasBreakout,
    showPercentages: hasBreakout,
  };
};

export const getHoverData = <TDatum>(
  bar: BarData<TDatum>,
  settings: VisualizationSettings,
  chartColumns: ChartColumns,
  multipleSeries: Series<TDatum, SeriesInfo>[],
  seriesColors: Record<string, string>,
) => {
  return {
    settings,
    datumIndex: bar.datumIndex,
    index: bar.seriesIndex,
    dataTooltip: getTooltipModel(
      bar,
      settings,
      chartColumns,
      multipleSeries,
      seriesColors,
    ),
  };
};
