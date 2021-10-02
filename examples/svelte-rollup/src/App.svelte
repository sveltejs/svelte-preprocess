<template lang="pug">
  h1 Hello!
  br
  input(bind:value="{label}")
  br
  Nested("{label}")
</template>

<script lang="ts">
  import Nested from './Nested.svelte'
  export let label: string = ''

  $: console.log(label)
</script>

<style lang="stylus">
	h1
		color blue
</style>