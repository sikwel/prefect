import { AxiosResponse } from 'axios'
import { DateString } from '..'
import { FlowRun, RunHistory, StateHistory, StateType, IFlowRunnerResponse } from '@/models'
import { Api, Route } from '@/services/Api'
import { FlowRunsHistoryFilter, UnionFilters } from '@/services/Filter'
import { IStateResponse, statesApi } from '@/services/StatesApi'
import { State, StateName } from '@/types/states'

export type IFlowRunResponse = {
  id: string,
  created: DateString,
  updated: DateString,
  name: string | null,
  flow_id: string,
  state_id: string | null,
  deployment_id: string | null,
  flow_version: string | null,
  parameters: unknown,
  idempotency_key: string | null,
  context: unknown,
  empirical_policy: unknown,
  empirical_config: unknown,
  tags: string[] | null,
  parent_task_run_id: string | null,
  state_type: StateType | null,
  run_count: number | null,
  expected_start_time: DateString | null,
  next_scheduled_start_time: DateString | null,
  start_time: DateString | null,
  end_time: DateString | null,
  total_run_time: number | null,
  estimated_run_time: number | null,
  estimated_start_time_delta: number | null,
  auto_scheduled: boolean | null,
  flow_runner: IFlowRunnerResponse | null,
  state: IStateResponse | null,
}

export type IStateHistoryResponse = {
  state_type: State,
  state_name: StateName,
  count_runs: number,
  sum_estimated_run_time: number,
  sum_estimated_lateness: number,
}

export type IFlowRunHistoryResponse = {
  interval_start: Date,
  interval_end: Date,
  states: IStateHistoryResponse[],
}

export class FlowRunsApi extends Api {

  protected route: Route = '/flow_runs'

  public getFlowRun(id: string): Promise<FlowRun> {
    return this.get<IFlowRunResponse>(`/${id}`).then(response => this.mapFlowRunResponse(response))
  }

  public getFlowRuns(filter: UnionFilters): Promise<FlowRun[]> {
    return this.post<IFlowRunResponse[]>('/filter', filter).then(response => this.mapFlowRunsResponse(response))
  }

  public getFlowRunsCount(filter: UnionFilters): Promise<number> {
    return this.post<number>('/count', filter).then(({ data }) => data)
  }

  public getFlowRunsHistory(filter: FlowRunsHistoryFilter): Promise<RunHistory[]> {
    return this.post<IFlowRunHistoryResponse[]>('/history', filter).then(response => this.mapFlowRunsHistoryResponse(response))
  }

  protected mapFlowRun(data: IFlowRunResponse): FlowRun {
    return new FlowRun({
      id: data.id,
      deploymentId: data.deployment_id,
      flowId: data.flow_id,
      flowVersion: data.flow_version,
      idempotencyKey: data.idempotency_key,
      nextScheduledStartTime: data.next_scheduled_start_time,
      parameters: data.parameters,
      autoScheduled: data.auto_scheduled,
      context: data.context,
      empiricalConfig: data.empirical_config,
      empiricalPolicy: data.empirical_policy,
      estimatedRunTime: data.estimated_run_time,
      estimatedStartTimeDelta: data.estimated_start_time_delta,
      totalRunTime: data.total_run_time,
      startTime: data.start_time ? new Date(data.start_time) : null,
      endTime: data.end_time ? new Date(data.end_time) : null,
      name: data.name,
      parentTaskRunId: data.parent_task_run_id,
      stateId: data.state_id,
      stateType: data.state_type,
      state: data.state ? statesApi.stateMapper(data.state) : null,
      tags: data.tags,
      runCount: data.run_count,
      created: new Date(data.created),
      updated: new Date(data.updated),
    })
  }

  protected mapFlowRunsHistory(data: IFlowRunHistoryResponse): RunHistory {
    return new RunHistory({
      intervalStart: new Date(data.interval_start),
      intervalEnd: new Date(data.interval_end),
      states: data.states.map(this.mapStateHistory),
    })
  }

  protected mapStateHistory(data: IStateHistoryResponse): StateHistory {
    return new StateHistory({
      stateType: data.state_type,
      stateName: data.state_name,
      countRuns: data.count_runs,
      sumEstimatedRunTime: data.sum_estimated_run_time,
      sumEstimatedLateness: data.sum_estimated_lateness,
    })
  }

  protected mapFlowRunsHistoryResponse({ data }: AxiosResponse<IFlowRunHistoryResponse[]>): RunHistory[] {
    return data.map(this.mapFlowRunsHistory)
  }

  protected mapFlowRunHistoryResponse({ data }: AxiosResponse<IFlowRunHistoryResponse>): RunHistory {
    return this.mapFlowRunsHistory(data)
  }

  protected mapFlowRunsResponse({ data }: AxiosResponse<IFlowRunResponse[]>): FlowRun[] {
    return data.map(this.mapFlowRun)
  }

  protected mapFlowRunResponse({ data }: AxiosResponse<IFlowRunResponse>): FlowRun {
    return this.mapFlowRun(data)
  }

}

export const flowRunsApi = new FlowRunsApi()