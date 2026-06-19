import { TestBed } from '@angular/core/testing';

import { UsoDeAPI } from './uso-de-api';

describe('UsoDeAPI', () => {
  let service: UsoDeAPI;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsoDeAPI);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
