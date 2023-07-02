import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import { Avatar, Box, Button, CssBaseline, Divider, Grid, IconButton, Modal, Paper, TextField, Typography, makeStyles } from '@material-ui/core';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import EmailIcon from "@material-ui/icons/Email";
import CameraIcon from "@material-ui/icons/Camera";
import SendIcon from "@material-ui/icons/Send";

import { updateUserProfile } from '../features/userSlice';
import { auth, provider, storage } from '../firebase';
import styles from './Auth.module.css'

const getModalStyle = () => {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`
  }
}

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
  image: {
    backgroundImage: 'url(https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80)',
    backgroundRepeat: 'no-repeat',
    backgroundColor:
      theme.palette.type === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  modal: {
    outline: 'none',
    position: 'absolute',
    width: 400,
    borderRadius: 10,
    backgroundColor: 'white',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(10)
  }
}));

const Auth: React.FC = () => {
  const dispatch = useDispatch()
  const classes = useStyles();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [avatarImage, setAvatarImage] = useState<File | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const sendResetEmail = async (e: React.MouseEvent<HTMLElement>) => {
    await auth.sendPasswordResetEmail(resetEmail).then(() => {
      setOpenModal(false)
      setResetEmail('')
    }).catch((err) => {
      alert(err.message)
      setResetEmail('')
    })
  }

  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files![0]) {
      setAvatarImage(e.target.files![0])
      e.target.value = ''
    }
  }
  
  const signInEmail = async () => {
    await auth.signInWithEmailAndPassword(email, password)
  }

  const signUpEmail = async () => {
    const authUser = await auth.createUserWithEmailAndPassword(email, password)
    let url = "";
    if(avatarImage) {
      const S = 'abcdefjhijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const N = 16
      const randomChara = Array.from(crypto.getRandomValues(new Uint32Array(N)))
      .map((n) => S[n % S.length])
      .join('')
      const fileName = randomChara + '_' + avatarImage.name

      // storageのavatar/${filename}にimageのURLを保存する
      await storage.ref(`avatars/${fileName}`).put(avatarImage)
      url = await storage.ref('avatars').child(fileName).getDownloadURL()
    }
    // firebaseの持つユーザの情報を更新する
    await authUser.user?.updateProfile({
      displayName: username,
      photoURL: url
    })
    dispatch(
      updateUserProfile({
        displayName: username,
      photoURL: url
      })
    )
  }

  const signInGoogle = async() => {
    await auth.signInWithPopup(provider).catch((err) => alert(err.message))
  }

  return (
    <Grid container component="main" className={classes.root}>
      <CssBaseline />
      <Grid item xs={false} sm={4} md={7} className={classes.image} />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            {isLogin ? 'SignIn' : 'Register'}
          </Typography>
          <form className={classes.form} noValidate>
            {!isLogin &&
              <>
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                />
                <Box style={{ textAlign: 'center' }}>
                  <IconButton>
                    <label>
                      <AccountCircleIcon
                        fontSize='large'
                        className={
                          avatarImage
                            ? styles.login_addIconLoaded
                            : styles.login_addIcon
                        }
                      />
                      <input
                        className={styles.login_hiddenIcon}
                        type='file'
                        onChange={onChangeImageHandler}
                      />
                    </label>
                  </IconButton>
                </Box>
              </>
            }
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
            <Button
              disabled={
                isLogin
                  ? !email || password.length< 6
                  : !username || !email || password.length < 6 || !avatarImage
              }
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              startIcon={<EmailIcon />}
              onClick={
                isLogin
                  ? async () => {
                      try {
                        await signInEmail();
                      } catch (err:any) {
                        alert(err.message);
                      }
                    }
                  : async () => {
                      try {
                        await signUpEmail();
                      } catch (err:any) {
                        alert(err.message);
                      }
                    }
              }
            >
              {isLogin ? 'SignIn' : 'Register'}
            </Button>
            <Divider style={{ marginBottom: '10px' }}/>
            <Grid container>
              <Grid item xs>
                <span
                  className={styles.login_reset}
                  onClick={() => setOpenModal(true)}
                >
                  Forgot Password?
                </span>
              </Grid>
              <Grid item>
                <span
                  onClick={() => setIsLogin(!isLogin)}
                  className={styles.login_toggleMode}
                >
                  {isLogin ? 'Create new account?' : 'Back to login'}
                </span>
              </Grid>
            </Grid>
            <Button
              fullWidth
              color="primary"
              startIcon={<CameraIcon />}
              className={classes.submit}
              onClick={signInGoogle}
              style={{ backgroundColor: '#f44336', color: 'white' }}
            >
              Sign With Google
            </Button>
          </form>
          <Modal
            open={openModal}
            onClose={() => setOpenModal(false)}
          >
            <div
              style={getModalStyle()}
              className={classes.modal}
            >
              <div className={styles.login_modal}>
                <TextField
                  InputLabelProps={{
                    shrink: true,
                  }}
                  type="email"
                  name="email"
                  label="Reset Password"
                  value={resetEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setResetEmail(e.target.value);
                  }}
                />
                <IconButton onClick={sendResetEmail}>
                  <SendIcon />
                </IconButton>
              </div>
            </div>
          </Modal>
        </div>
      </Grid>
    </Grid>
  );
}

export default Auth