import React, { useState } from 'react'
import  styles from './TweetInput.module.css'
import { useSelector } from 'react-redux'
import { selectUser } from '../features/userSlice'
import { auth, storage, db } from '../firebase'
import { Avatar, Button, IconButton } from '@material-ui/core'
import firebase from 'firebase/app'
import AddAPhotoIcon from '@material-ui/icons/AddAPhoto'

const TweetInput = () => {
  const user = useSelector(selectUser)
  const [tweetMessage, setTweetMessage] = useState('')
  const [tweetImage, setTweetImage] = useState<File | null>(null)

  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files![0]) {
      setTweetImage(e.target.files![0])
      e.target.value = ''
    }
  }

  const sendTweet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (tweetImage) {
      const S = 'abcdefjhijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const N = 16
      const randomChara = Array.from(crypto.getRandomValues(new Uint32Array(N)))
      .map((n) => S[n % S.length])
      .join('')
      const fileName = randomChara + '_' + tweetImage.name
      const uploadTweetImage = storage.ref(`images/${fileName}`).put(tweetImage)
      uploadTweetImage.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        () => {},
        (err) => {
          alert(err.message)
        },
        async () => {
          await storage.ref('images').child(fileName).getDownloadURL().then(
            async (url) => {
              await db.collection('posts').add({
                avatar: user.photoURL,
                image: url,
                text: tweetMessage,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                username: user.displayName
              })
            }
          )
        }
      )
    } else {
      db.collection('posts').add({
        avatar: user.photoURL,
        image: '',
        text: tweetMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        username: user.displayName
      })
      setTweetImage(null)
      setTweetMessage('')
    }
  }

  return (
    <>
      <form onSubmit={sendTweet}>
        <div className={styles.tweet_form}>
          <Avatar
            className={styles.tweet_avatar}
            src={user.photoURL}
            onClick={
              async () => {
                await auth.signOut()
              }
            }
          />
          <input
            className={styles.tweet_input}
            placeholder="What's happening?"
            type='text'
            autoFocus
            value={tweetMessage}
            onChange={(e) => setTweetMessage(e.target.value)}
          />
          <IconButton>
            <label>
              <AddAPhotoIcon
                className={
                  tweetImage ? styles.tweet_addIconLoaded : styles.tweet_addIcon
                }
              />
              <input
                className={styles.tweet_hiddenIcon}
                type='file'
                onChange={onChangeImageHandler}
              />
            </label>
          </IconButton>
        </div>
        <Button
          type='submit'
          disabled={!tweetMessage}
          className={
            tweetMessage ? styles.tweet_sendBtn : styles.tweet_sendDisableBtn
          }
        >Tweet</Button>
      </form>
    </>
  )
}

export default TweetInput
