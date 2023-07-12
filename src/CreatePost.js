import * as React from 'react'
import tagStyled from 'styled-components'
import { Button } from './App'

const CreatePost = ({createPost, posts}) => {
    const [postText, setPostText] = React.useState("")
    const [hastagText, setHastagText] = React.useState("")

    const submit = async () => {
        if(postText && hastagText) {
            await createPost(postText, hastagText, posts.length)
            setHastagText('')
            setPostText('')
        }
    }

    return (
        <CreateLayout>
            <TextArea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                rows={1}
                placeholder="What's happening?..."
            />

            <TextArea
                value={hastagText}
                onChange={(e) => setHastagText(e.target.value)}
                rows={1}
                placeholder="#hastag"
            />

            <Button onClick={submit}>
                Create Post
            </Button>
        </CreateLayout>
    )
}

export default CreatePost;

const CreateLayout = tagStyled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 4rem;
`

const TextArea = tagStyled.textarea`
    width: 40rem;
    min-height: 5rem;
    padding: 0.5rem;
`