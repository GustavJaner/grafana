import React, { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { LoadingState } from '@grafana/data';
import { EditorHeader, EditorRows, FlexItem, InlineSelect, Space } from '@grafana/experimental';
import { Button, ConfirmModal } from '@grafana/ui';
import { PromQueryEditorProps } from '../../components/types';
import { promQueryModeller } from '../PromQueryModeller';
import { QueryEditorModeToggle } from '../shared/QueryEditorModeToggle';
import { QueryHeaderSwitch } from '../shared/QueryHeaderSwitch';
import { QueryEditorMode } from '../shared/types';
import { PromQueryBuilderExplained } from './PromQueryBuilderExplained';
import { buildVisualQueryFromString } from '../parsing';
import { PromQueryCodeEditor } from './PromQueryCodeEditor';
import { PromQueryBuilderContainer } from './PromQueryBuilderContainer';
import { PromQueryBuilderOptions } from './PromQueryBuilderOptions';
import { changeEditorMode, getQueryWithDefaults } from '../state';
import { PromQuery } from '../../types';

export const PromQueryEditorSelector = React.memo<PromQueryEditorProps>((props) => {
  const { onChange, onRunQuery, data } = props;
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [dataIsStale, setDataIsStale] = useState(false);

  const query = getQueryWithDefaults(props.query, props.app);
  const editorMode = query.editorMode!;

  const onEditorModeChange = useCallback(
    (newMetricEditorMode: QueryEditorMode) => {
      if (newMetricEditorMode === QueryEditorMode.Builder) {
        const result = buildVisualQueryFromString(query.expr || '');
        // If there are errors, give user a chance to decide if they want to go to builder as that can loose some data.
        if (result.errors.length) {
          setParseModalOpen(true);
          return;
        }
      }
      changeEditorMode(query, newMetricEditorMode, onChange);
    },
    [onChange, query]
  );

  useEffect(() => {
    setDataIsStale(false);
  }, [data]);

  const onQueryPreviewChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const isEnabled = event.currentTarget.checked;
    onChange({ ...query, editorPreview: isEnabled });
    onRunQuery();
  };

  const onChangeInternal = (query: PromQuery) => {
    setDataIsStale(true);
    onChange(query);
  };

  return (
    <>
      <ConfirmModal
        isOpen={parseModalOpen}
        title="Query parsing"
        body="There were errors while trying to parse the query. Continuing to visual builder may loose some parts of the query."
        confirmText="Continue"
        onConfirm={() => {
          changeEditorMode(query, QueryEditorMode.Builder, onChange);
          setParseModalOpen(false);
        }}
        onDismiss={() => setParseModalOpen(false)}
      />
      <EditorHeader>
        <FlexItem grow={1} />
        <Button
          variant={dataIsStale ? 'primary' : 'secondary'}
          size="sm"
          onClick={onRunQuery}
          icon={data?.state === LoadingState.Loading ? 'fa fa-spinner' : undefined}
          disabled={data?.state === LoadingState.Loading}
        >
          Run query
        </Button>
        {editorMode === QueryEditorMode.Builder && (
          <>
            <InlineSelect
              value={null}
              placeholder="Query patterns"
              allowCustomValue
              onChange={({ value }) => {
                // TODO: Bit convoluted as we don't have access to visualQuery model here. Maybe would make sense to
                //  move it inside the editor?
                const result = buildVisualQueryFromString(query.expr || '');
                result.query.operations = value?.operations!;
                onChange({
                  ...query,
                  expr: promQueryModeller.renderQuery(result.query),
                });
              }}
              options={promQueryModeller.getQueryPatterns().map((x) => ({ label: x.name, value: x }))}
            />
          </>
        )}
        <QueryHeaderSwitch
          label="Preview"
          value={query.editorPreview}
          onChange={onQueryPreviewChange}
          disabled={editorMode !== QueryEditorMode.Builder}
        />
        <QueryEditorModeToggle mode={editorMode} onChange={onEditorModeChange} />
      </EditorHeader>
      <Space v={0.5} />
      <EditorRows>
        {editorMode === QueryEditorMode.Code && <PromQueryCodeEditor {...props} />}
        {editorMode === QueryEditorMode.Builder && (
          <PromQueryBuilderContainer
            query={query}
            datasource={props.datasource}
            onChange={onChangeInternal}
            onRunQuery={props.onRunQuery}
            data={data}
          />
        )}
        {editorMode === QueryEditorMode.Explain && <PromQueryBuilderExplained query={query.expr} />}
        {editorMode !== QueryEditorMode.Explain && (
          <PromQueryBuilderOptions query={query} app={props.app} onChange={onChange} onRunQuery={onRunQuery} />
        )}
      </EditorRows>
    </>
  );
});

PromQueryEditorSelector.displayName = 'PromQueryEditorSelector';
