interface Window {
  require: {
    config: (config: { paths: { [key: string]: string } }) => void
  }
}
