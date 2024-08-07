/* eslint-disable */
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { showAlert } from './alerts';

/*
    type is either 'password' or 'data'
*/
export const updateSettings = async (data, type) => {
  try {
    const routeName = type === 'password' ? 'updatePassword' : 'updateMe';

    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${routeName}`,
      data,
    });

    if (res.status === StatusCodes.OK) {
      showAlert('success', `${type.toUpperCase()} Updated Successfully!`);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};
