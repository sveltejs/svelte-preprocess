<script context="module">
  export function preload({ params, query }) {
    return this.fetch(`blog.json`)
      .then(r => r.json())
      .then(posts => {
        return { posts }
      })
  }
</script>

<script type="text/typescript">
  interface Post {
    title: string
    slug: string
    html: string
  }

  export let posts: Post[] = []
</script>

<style>
  ul {
    margin: 0 0 1em 0;
    line-height: 1.5;
  }
</style>

<template lang="pug">
  ul
    +if('posts && posts.length > 1')
      +each('posts as post')
        li
          a(rel="prefetch" href="blog/{post.slug}") {post.title}
      +else()
        span No posts :c
</template>
