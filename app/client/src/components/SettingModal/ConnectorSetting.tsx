import Typography from "@mui/material/Typography";
import {
  Box,
  Button, Checkbox,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider, FormControl,
  FormControlLabel,
  InputAdornment, InputLabel, MenuItem,
  Paper, Select,
  TextField
} from "@mui/material";
import React, {useState} from "react";
import {ConnectorControllerApiFactory, FolderControllerApiFactory, SettingControllerApiFactory} from "../../api";
import {useSnackbar} from "notistack";
import {Formik, Form, Field, ErrorMessage, useFormik, FieldArray, getIn} from 'formik';
import * as yup from 'yup';
import {useQuery} from "@tanstack/react-query";
import {safeInt} from "../../common/typeUtils";
import Alert from "@mui/material/Alert";
import DeleteIcon from "@mui/icons-material/Delete";

export const ConnectorSetting = () => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const {enqueueSnackbar} = useSnackbar();
  const api = SettingControllerApiFactory();

  const {
    data: tokenResult,
    refetch: refetchTokenResult,
  } = useQuery(["github_token_check"], async () => (await api.isGithubPersonalTokenSetUsingGET()).data);

  const {
    data: twitterSettings,
    refetch: refetchTwitterSettings,
  } = useQuery(["twitter_settings"], async () => (await api.getTwitterUserSettingsUsingGET()).data);

  const formikGithub = useFormik({
    initialValues: {
      githubPersonalToken: ''
    },
    validationSchema: yup.object({
      githubPersonalToken: yup.string().required('Token is required.')
    }),
    onSubmit: (values) => {
      saveToken(values.githubPersonalToken)
    }
  })

  function deleteToken() {
    saveToken("");
  }

  function saveToken(token) {
    api.saveGithubPersonalTokenUsingPOST(token).then(() => {
      enqueueSnackbar(`Github token ${token ? "save" : "delete"} success.`, {
        variant: "success",
        anchorOrigin: {vertical: "bottom", horizontal: "center"}
      });
    }).catch((err) => {
      enqueueSnackbar('Github token save failed. Error: ' + err, {
        variant: "error",
        anchorOrigin: {vertical: "bottom", horizontal: "center"}
      });
    }).finally(() => {
      handleCloseDeleteDialog();
      refetchTokenResult();
    });
  }

  function handleCloseDeleteDialog() {
    setOpenDeleteDialog(false);
  }

  function showDeleteDialog() {
    setOpenDeleteDialog(true);
  }

  const twitterSettingsValidation = yup.object().shape({
    settings: yup.array().of(yup.object().shape({
      name: yup.string().required('Name is required.'),
      screenName: yup.string().required('Screen name is required.'),
      myself: yup.boolean().nullable(),
      tweetToLibraryType: yup.number().nullable(),
      bookmarkToLibraryType: yup.number().nullable(),
      likeToLibraryType: yup.number().nullable(),
    }))
  });

  return <React.Fragment>
    <div>
      <Typography variant={'h6'}>Github</Typography>
      <Divider/>
      <form onSubmit={formikGithub.handleSubmit}>
        {
          tokenResult && tokenResult.data && <div className={'mt-4'}>
            <Alert severity={'info'}>Token has been set.</Alert>
          </div>
        }
        <TextField fullWidth={true} size={'small'} margin={'normal'}
                   label={'Fine-grained personal access tokens'}
                   id={'githubPersonalToken'} name={'githubPersonalToken'}
                   value={formikGithub.values.githubPersonalToken}
                   onChange={formikGithub.handleChange}
                   error={formikGithub.touched.githubPersonalToken && Boolean(formikGithub.errors.githubPersonalToken)}
                   helperText={formikGithub.touched.githubPersonalToken && formikGithub.errors.githubPersonalToken}
        />
        <Button color={'primary'} variant={'contained'} size={'medium'} type={'submit'}>Save</Button>
        {
          tokenResult && tokenResult.data &&
          <Button color={'warning'} variant={'contained'} size={'medium'} type={'button'} sx={{ml: 2}}
                  onClick={showDeleteDialog}>Delete Token</Button>
        }
        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Are you sure you want to delete token?"}
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={deleteToken} autoFocus color={'warning'}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </form>
    </div>

    <div className={'mt-6'}>
      <Typography variant={'h6'}>Twitter</Typography>
      <Divider/>

      {
        twitterSettings && <Formik
          initialValues={{
            settings: !twitterSettings || twitterSettings.length == 0 ? [{
              id: null,
              name: "",
              screenName: ""
            }] : twitterSettings
          }}
          validationSchema={twitterSettingsValidation}
          onSubmit={values => {
            api.saveTwitterUserSettingsUsingPOST(values.settings).then(() => {
              enqueueSnackbar(`Twitter settings save success.`, {
                variant: "success",
                anchorOrigin: {vertical: "bottom", horizontal: "center"}
              });
            }).catch((err) => {
              enqueueSnackbar('Twitter settings save failed. Error: ' + err, {
                variant: "error",
                anchorOrigin: {vertical: "bottom", horizontal: "center"}
              });
            }).finally(() => {
              refetchTwitterSettings();
            });
          }}>
          {({values, touched, errors, handleChange, handleBlur, isValid}) => (
            <Form noValidate autoComplete="off">
              <FieldArray name="settings">
                {({push, remove}) => (
                  <div>
                    {values.settings.map((setting, index) => {
                      const name = `settings[${index}].name`;
                      const touchedName = getIn(touched, name);
                      const errorName = getIn(errors, name);

                      const screenName = `settings[${index}].screenName`;
                      const touchedScreenName = getIn(touched, screenName);
                      const errorScreenName = getIn(errors, screenName);

                      const tweetToLibraryType = `settings[${index}].tweetToLibraryType`;
                      const bookmarkToLibraryType = `settings[${index}].bookmarkToLibraryType`;
                      const likeToLibraryType = `settings[${index}].likeToLibraryType`;
                      const myself = `settings[${index}].myself`;

                      return (
                        <div key={index} className={`${index % 2 == 1 ? "bg-amber-50" : ""}`}>
                          <div>
                            <TextField
                              margin="normal"
                              size={'small'}
                              variant="outlined"
                              label="Name"
                              name={name}
                              value={setting.name}
                              className={'w-[200px]'}
                              required
                              helperText={
                                touchedName && errorName
                                  ? errorName
                                  : ""
                              }
                              error={Boolean(touchedName && errorName)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <TextField
                              margin="normal"
                              className={'ml-2 w-[200px]'}
                              size={'small'}
                              variant="outlined"
                              label="Screen name"
                              name={screenName}
                              value={setting.screenName}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">@</InputAdornment>,
                              }}
                              required
                              helperText={
                                touchedScreenName && errorScreenName
                                  ? errorScreenName
                                  : ""
                              }
                              error={Boolean(touchedScreenName && errorScreenName)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <FormControlLabel className={'ml-2 mt-4'}
                                              control={<Checkbox value={true} name={myself} onChange={handleChange}
                                                                 checked={!!(setting.myself)}/>} label="Me"/>
                            <Button
                              className={'ml-2 float right mt-4'}
                              type="button"
                              color="secondary"
                              variant="outlined"
                              startIcon={<DeleteIcon/>}
                              onClick={() => remove(index)}
                            >
                              DELETE
                            </Button>
                          </div>
                          <div className={'flex mt-1'}>
                            <FormControl className={'w-[200px]'}>
                              <InputLabel size={'small'}>Tweets hunt</InputLabel>
                              <Select
                                name={tweetToLibraryType}
                                value={setting.tweetToLibraryType || 0}
                                label="Tweets hunt"
                                onChange={handleChange}
                                size={'small'}
                              >
                                <MenuItem value={0}>Not set</MenuItem>
                                <MenuItem value={1}>Save to my list</MenuItem>
                                <MenuItem value={2}>Save to starred</MenuItem>
                                <MenuItem value={3}>Save to read later</MenuItem>
                                <MenuItem value={4}>Save to archive</MenuItem>
                              </Select>
                            </FormControl>
                            <FormControl className={'w-[200px] ml-2'}>
                              <InputLabel size={'small'}>Bookmarks hunt</InputLabel>
                              <Select
                                name={bookmarkToLibraryType}
                                value={setting.bookmarkToLibraryType || 0}
                                label="Bookmarks hunt"
                                onChange={handleChange}
                                size={'small'}
                              >
                                <MenuItem value={0}>Not set</MenuItem>
                                <MenuItem value={1}>Save to my list</MenuItem>
                                <MenuItem value={2}>Save to starred</MenuItem>
                                <MenuItem value={3}>Save to read later</MenuItem>
                                <MenuItem value={4}>Save to archive</MenuItem>
                              </Select>
                            </FormControl>
                            <FormControl className={'w-[200px] ml-2'}>
                              <InputLabel size={'small'}>Likes hunt</InputLabel>
                              <Select
                                name={likeToLibraryType}
                                value={setting.likeToLibraryType || 0}
                                label="Likes hunt"
                                onChange={handleChange}
                                size={'small'}
                              >
                                <MenuItem value={0}>Not set</MenuItem>
                                <MenuItem value={1}>Save to my list</MenuItem>
                                <MenuItem value={2}>Save to starred</MenuItem>
                                <MenuItem value={3}>Save to read later</MenuItem>
                                <MenuItem value={4}>Save to archive</MenuItem>
                              </Select>
                            </FormControl>
                          </div>
                          <Divider className={'mt-3'}/>
                        </div>
                      );
                    })}
                    <Button
                      className={'mt-2'}
                      type="button"
                      variant="outlined"
                      onClick={() =>
                        push({id: null, name: "", screenName: ""})
                      }
                    >
                      Add
                    </Button>
                  </div>
                )}
              </FieldArray>
              <Divider style={{marginTop: 20, marginBottom: 20}}/>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                // disabled={!isValid || values.settings.length === 0}
              >
                save
              </Button>
              {/*<Divider style={{marginTop: 20, marginBottom: 20}}/>*/}
              {/*{(*/}
              {/*  <>*/}
              {/*<pre style={{textAlign: "left"}}>*/}
              {/*<strong>Values</strong>*/}
              {/*<br/>*/}
              {/*  {JSON.stringify(values, null, 2)}*/}
              {/*</pre>*/}
              {/*    <pre style={{textAlign: "left"}}>*/}
              {/*<strong>Errors</strong>*/}
              {/*<br/>*/}
              {/*      {JSON.stringify(errors, null, 2)}*/}
              {/*</pre>*/}
              {/*  </>*/}
              {/*)}*/}
            </Form>
          )}
        </Formik>
      }
    </div>
  </React.Fragment>
}