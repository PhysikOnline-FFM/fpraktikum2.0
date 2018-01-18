import * as fromUser from '../actions/user.action';
import { User } from '../../models/user';

export interface UserState {
  data: User;
  loaded: boolean;
  loading: boolean;
}

export const initialState: UserState = {
  loaded: false,
  loading: false,
  data: null,
};

export function reducer(state = initialState, action: fromUser.UserAction): UserState {
  switch (action.type) {
    case fromUser.LOAD_USER: {
      return {
        ...state,
        loading: true,
      };
    }
    case fromUser.LOAD_USER_SUCCESS: {
      return {
        ...state,
        loading: false,
        loaded: true,
      };
    }
    case fromUser.LOAD_USER_FAIL: {
      return {
        ...state,
        loading: false,
        loaded: false,
      };
    }
  }
  return state;
}