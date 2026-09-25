import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import i18n from '../i18n';
import DashboardNextStepArea from './DashboardNextStepArea';
import { dashboardGuidanceInput } from '../guidance/dashboardGuidance';
import { resolveGuidance } from '../guidance/resolveGuidance';

const stamp = { scopeKey: 'learner-en', revision: 0 };
const attempt = id => ({ attemptId: id, scenarioSlug: 'parcel-sms', title: 'Parcel SMS' });
const rec = { id: 7, status: 'active', target: { page: 'resources' }, reasonText: 'Pause and check.' };
function props({ attempts = [attempt(9)], recommendation = rec, owner = {}, recommendationOwner = {}, scope = stamp } = {}) {
  const input = dashboardGuidanceInput({ stamp: scope,
    assessment: { guidanceStamp: scope, status: 'pending', ...owner },
    scenario: { guidanceStamp: scope, dashboard: { inProgressAttempts: attempts } },
    recommendation: { guidanceStamp: scope, recommendation, ...recommendationOwner },
  });
  return { stamp: scope, guidance: resolveGuidance(input), inventory: attempts,
    recommendationObservation: input.currentRecommendation, recommendation, recommendationTitle: 'Check a source',
    requestScenarioExactResume: jest.fn(), requestAssessmentExactResume: jest.fn(),
    onFollow: jest.fn(), onComplete: jest.fn(), onRetry: jest.fn(), ...owner.props };
}
const switchTo = () => fireEvent.click(screen.getByRole('button', { name: 'Recommended', exact: true }));
beforeEach(async () => { await i18n.changeLanguage('en'); });

test('real Continue actions have decorative arrows and retain exact click targets',()=>{
 const p=props({owner:{status:'in_progress',attempt:{id:7}}});render(<DashboardNextStepArea {...p}/>);
 const assessment=screen.getByRole('button',{name:'Continue assessment',exact:true});
 const scenario=screen.getByRole('button',{name:'Continue scenario: Parcel SMS',exact:true});
 for(const action of [assessment,scenario]){
   expect(action.querySelector('.dashboard-action-arrow')).toHaveTextContent('→');
   expect(action.querySelector('.dashboard-action-arrow')).toHaveAttribute('aria-hidden','true');
   expect(action).not.toHaveAccessibleName(/→/);expect(action).not.toHaveFocus();
 }
 for(const name of ['Continue','Recommended'])expect(screen.getByRole('button',{name,exact:true}).querySelector('.dashboard-action-arrow')).toBeNull();
 expect(p.requestAssessmentExactResume).not.toHaveBeenCalled();expect(p.requestScenarioExactResume).not.toHaveBeenCalled();
 fireEvent.click(assessment);expect(p.requestAssessmentExactResume).toHaveBeenCalledWith({type:'resume_assessment',attemptId:7});
 fireEvent.click(scenario);expect(p.requestScenarioExactResume).toHaveBeenCalledWith({type:'resume_scenario',attemptId:9,scenarioSlug:'parcel-sms'});
});
test('each unfinished activity has a presentational trailing arrow',()=>{
 render(<DashboardNextStepArea {...props({owner:{status:'in_progress',attempt:{id:7}}})}/>);
 for(const action of document.querySelectorAll('.dashboard-resume-choice')){
   const arrow=action.querySelector('.dashboard-action-arrow');
   expect(arrow).toHaveTextContent('→');expect(arrow).toHaveAttribute('aria-hidden','true');
   expect(action).not.toHaveAccessibleName(/→/);
 }
});
test.each([['scenarios','View recommended scenario'],['resources','Read recommended resource'],['assessment','View assessment'],['progress','Open recommendation']])('canonical %s CTA copy and decorative affordance', (page,name)=>{
 const p=props({attempts:[],recommendation:{...rec,target:{page}}});render(<DashboardNextStepArea {...p}/>);
 const action=screen.getByRole('button',{name,exact:true});
 expect(action.querySelector('.dashboard-action-arrow')).toHaveAttribute('aria-hidden','true');
 expect(action.querySelector('.dashboard-action-arrow')).toHaveTextContent('→');expect(action).toHaveAccessibleName(name);
 action.focus();expect(p.onFollow).not.toHaveBeenCalled();fireEvent.click(action);expect(p.onFollow).toHaveBeenCalledTimes(1);
});

test('mixed starts with Continue; render, focus and manual switching perform no actions', () => {
  const p = props(); render(<DashboardNextStepArea {...p} />);
  expect(screen.getByRole('button', { name: 'Continue', exact: true })).toHaveAttribute('aria-pressed','true');
  screen.getByRole('button', { name: 'Recommended', exact: true }).focus(); switchTo();
  expect(screen.getByText('Pause and check.')).toBeVisible();
  expect(document.activeElement).toHaveAccessibleName('Recommended');
  for (const fn of [p.onFollow,p.onComplete,p.requestScenarioExactResume,p.requestAssessmentExactResume]) expect(fn).not.toHaveBeenCalled();
});
test('one unfinished only has no family controls and delegates only its exact target', () => {
  const p=props({recommendation:null}); render(<DashboardNextStepArea {...p}/>);
  fireEvent.click(screen.getByRole('button',{name:'Continue scenario: Parcel SMS'}));
  expect(p.requestScenarioExactResume).toHaveBeenCalledTimes(1);
  expect(p.requestScenarioExactResume).toHaveBeenCalledWith({type:'resume_scenario',attemptId:9,scenarioSlug:'parcel-sms'});
  expect(screen.queryByRole('button',{name:'Recommended',exact:true})).toBeNull();
  expect(p.onFollow).not.toHaveBeenCalled();
});
test('duplicate titles have equal, distinct session labels and exact internal targets without IDs', () => {
  const p=props({attempts:[attempt(912),attempt(945)],recommendation:null}); const {container}=render(<DashboardNextStepArea {...p}/>);
  const buttons=screen.getAllByRole('button');
  expect(buttons).toHaveLength(2); expect(buttons[0].className).toBe(buttons[1].className);
  expect(buttons[0]).toHaveAccessibleName('Continue scenario: Parcel SMS Saved practice 1');
  expect(buttons[1]).toHaveAccessibleName('Continue scenario: Parcel SMS Saved practice 2');
  buttons.forEach(button=>{expect(button).not.toHaveAttribute('aria-pressed');expect(button).not.toHaveFocus();});
  expect(container.innerHTML).not.toMatch(/912|945|parcel-sms/);
  fireEvent.click(buttons[1]); expect(p.requestScenarioExactResume).toHaveBeenCalledWith({type:'resume_scenario',attemptId:945,scenarioSlug:'parcel-sms'});
});
test('missing title never falls back to raw slug',()=>{
  render(<DashboardNextStepArea {...props({attempts:[{attemptId:9,scenarioSlug:'private-slug'}],recommendation:null})}/>);
  expect(screen.getByRole('button',{name:'Continue scenario: Saved practice'})).toBeVisible();
  expect(screen.queryByText(/private-slug/)).toBeNull();
});
test('recommendation only initially reveals the valid explicit action',()=>{
  const p=props({attempts:[]});render(<DashboardNextStepArea {...p}/>);
  fireEvent.click(screen.getByRole('button',{name:i18n.t('dashboard.recommendation.readResource')}));expect(p.onFollow).toHaveBeenCalledTimes(1);
});
test.each(['loading','error','unknown'])('recommendation %s hides stale text/actions and offers truthful state',state=>{
  const p=props({attempts:[],recommendationOwner:state==='unknown'?{guidanceStamp:null}:{[state]:true}});
  render(<DashboardNextStepArea {...p}/>);
  expect(screen.queryByText('Pause and check.')).toBeNull();
  expect(screen.queryByRole('button',{name:i18n.t('dashboard.recommendation.readResource')})).toBeNull();
  expect(screen.getByText(i18n.t(state==='loading'?'dashboard.recommendation.loading':'dashboard.integrated.recommendationUnavailable'))).toBeVisible();
  if(state!=='loading'){fireEvent.click(screen.getAllByRole('button',{name:i18n.t('dashboard.integrated.retry')})[0]);expect(p.onRetry).toHaveBeenCalledTimes(1);}
});
test.each(['unknown','error'])('unfinished owner %s is not empty confirmation',state=>{
  render(<DashboardNextStepArea {...props({owner:state==='error'?{error:true}:{status:'unknown'}})}/>);
  expect(screen.getByText(i18n.t('dashboard.nextStep.ownerUnavailable'))).toBeVisible();
  expect(screen.queryByRole('button',{name:/Continue scenario/})).toBeNull();
});
test.each([null,{page:'unknown'},{page:'scenarios',scenarioSlug:'bad/slug'}])('malformed target %j cannot follow or complete',target=>{
  const p=props({attempts:[],recommendation:{...rec,target}});render(<DashboardNextStepArea {...p}/>);
  expect(screen.getByText(i18n.t('dashboard.integrated.recommendationUnavailable'))).toBeVisible();
  expect(screen.queryByRole('button',{name:i18n.t('dashboard.recommendation.readResource')})).toBeNull();
  expect(p.onFollow).not.toHaveBeenCalled();expect(p.onComplete).not.toHaveBeenCalled();
});
test.each([{id:0},{id:'7'},{status:undefined},{status:'expired'}])('invalid recommendation identity/lifecycle %j is recovery',invalid=>{
  render(<DashboardNextStepArea {...props({attempts:[],recommendation:{...rec,...invalid}})}/>);
  expect(screen.getByText(i18n.t('dashboard.integrated.recommendationUnavailable'))).toBeVisible();
  expect(screen.queryByText('Pause and check.')).toBeNull();
});
test('duplicate labels survive family switches and an earlier attempt leaving the inventory',()=>{
  const p=props({attempts:[attempt(9),attempt(12)]});const {rerender}=render(<DashboardNextStepArea {...p}/>);switchTo();
  rerender(<DashboardNextStepArea {...props({attempts:[attempt(12)]})}/>);
  fireEvent.click(screen.getByRole('button',{name:'Continue',exact:true}));
  expect(screen.getByRole('button',{name:'Continue scenario: Parcel SMS Saved practice 2'})).toBeVisible();
});
test('completion pending and failure retain selected family and prevent pending duplicate action',()=>{
  const p=props({recommendation:{...rec,topicCode:'phishing'}});const {rerender}=render(<DashboardNextStepArea {...p}/>);switchTo();
  fireEvent.click(screen.getByRole('button',{name:i18n.t('progress.recommendation.markComplete')}));
  rerender(<DashboardNextStepArea {...p} completing/>);
  fireEvent.click(screen.getByRole('button',{name:i18n.t('common.saving')}));expect(p.onComplete).toHaveBeenCalledTimes(1);
  rerender(<DashboardNextStepArea {...p} completionError/>);
  expect(screen.getByRole('button',{name:'Recommended',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(screen.getByText(i18n.t('dashboard.integrated.completionUnavailable'))).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:i18n.t('progress.recommendation.markComplete')}));expect(p.onComplete).toHaveBeenCalledTimes(2);
});
test('late same-scope data cannot steal manual selection',()=>{
  const p=props();const {rerender}=render(<DashboardNextStepArea {...p}/>);switchTo();
  rerender(<DashboardNextStepArea {...props({attempts:[attempt(9),attempt(12)]})}/>);
  expect(screen.getByRole('button',{name:'Recommended',exact:true})).toHaveAttribute('aria-pressed','true');
});
test.each([{scopeKey:'new-learner',revision:0},{scopeKey:stamp.scopeKey,revision:1}])('scope change resets manual choice and rejects stale actions %j',scope=>{
  const p=props();const {rerender}=render(<DashboardNextStepArea {...p}/>);switchTo();
  rerender(<DashboardNextStepArea {...p} stamp={scope}/>);
  expect(screen.queryByText('Pause and check.')).toBeNull();expect(screen.queryByRole('button',{name:/Continue scenario/})).toBeNull();
  rerender(<DashboardNextStepArea {...props({scope})}/>);
  expect(screen.getByRole('button',{name:'Continue',exact:true})).toHaveAttribute('aria-pressed','true');
});
