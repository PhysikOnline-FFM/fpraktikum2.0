import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { GRADUATION } from '../../../config';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { MetaInfoState } from '../store/reducers/meta-info.reducer';
import { Store } from '@ngrx/store';
import { UpdateRegistrationStep } from '../store/actions/meta-info.action';
import { REGISTRATION_STEP } from '../../models/registration-step';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { PartnerState } from '../store/reducers/partner.reducer';
import { UserState } from '../store/reducers/user.reducer';
import { debounceTime, filter, map } from 'rxjs/operators';

import * as selectors from '../store/selectors';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CheckPartner, UpdateSelectedInstitutes } from '../store/index';
import { RemovePartner } from '../store/actions/partner.action';
import { UpdateNotes } from '../store/actions/user.action';
import { ChosenPartner } from '../../models/chosen-partner';
import { Institute } from '../../models/institute';

@Component({
  selector: 'app-registration-form-main',
  templateUrl: './registration-form-main.component.html',
  styleUrls: ['./registration-form-main.component.scss'],
})
export class RegistrationFormMainComponent implements OnInit, OnDestroy {
  private sub = new Subscription();
  private set sink(sub: Subscription) {
    this.sub.add(sub);
  }

  readonly userGraduation = this.metaStore.select(selectors.getGraduation);
  readonly partner = this.partnerStore.select(selectors.getPartner);
  readonly partnerType = this.partnerStore.select(selectors.getPartnerType);

  readonly chooseOnlyOneInstitute = this.userGraduation.map(
    g => g === GRADUATION.LA
  );

  readonly partnerAcceptable = this.partnerType.map(
    type => type === ChosenPartner.notRegistered
  );

  readonly availableInstitutes = this.metaStore.select(
    selectors.getAvailableInstitutes
  );

  readonly selectedInstitutes = this.metaStore.map(
    selectors.getSelectedInstitutes
  );

  readonly selectedInstitutesOk = Observable.combineLatest(
    this.chooseOnlyOneInstitute,
    this.selectedInstitutes
  ).pipe(map(([one, institutes]) => institutes.length === (one ? 1 : 2)));

  readonly partnerForm: FormGroup;
  readonly notesForm: FormGroup;

  readonly partnerInput = new Subject();
  readonly notesInput: ReplaySubject<void> = new ReplaySubject(1);

  readonly noPartner = new BehaviorSubject(false);

  institutes: Institute[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private metaStore: Store<MetaInfoState>,
    private partnerStore: Store<PartnerState>,
    private userStore: Store<UserState>
  ) {
    this.partnerForm = formBuilder.group({
      partnerNumber: ['', Validators.required],
      partnerName: ['', Validators.required],
    });
    this.notesForm = formBuilder.group({
      notes: [''],
    });
    this.userGraduation.subscribe(console.log);

    this.sink = this.partnerInput
      .pipe(filter(() => this.partnerForm.valid), debounceTime(500))
      .subscribe(this.checkPartner.bind(this));
    this.sink = this.noPartner.subscribe(this.onNoPartner.bind(this));
    this.sink = this.notesInput
      .pipe(debounceTime(500))
      .subscribe(this.onNotesUpdate.bind(this));
  }

  checkPartner() {
    const number = this.partnerForm.get('partnerNumber').value;
    const name = this.partnerForm.get('partnerName').value;

    this.partnerStore.dispatch(new CheckPartner({ number, name }));
  }

  private onNoPartner(res: boolean): void {
    if (res) {
      this.partnerStore.dispatch(new RemovePartner());
      this.partnerForm.reset();
      this.partnerForm.disable();
    } else {
      this.partnerForm.enable();
    }
  }

  private onNotesUpdate(): void {
    const notes = this.notesForm.get('notes').value;
    this.userStore.dispatch(new UpdateNotes(notes));
  }

  startNextStep() {
    this.metaStore.dispatch(new UpdateRegistrationStep(REGISTRATION_STEP.END));
  }

  private updateInstitutes(institutes: Institute[]): void {
    return this.metaStore.dispatch(new UpdateSelectedInstitutes(institutes));
  }

  resetInstitutes() {
    this.metaStore.dispatch(new UpdateSelectedInstitutes([]));
  }

  ngOnInit() {}
  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
