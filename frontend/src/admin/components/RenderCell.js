// resources.js'teki sütun render() sonucunu (metin, Vue öğesi ya da dizi) olduğu gibi çizer.
export default function RenderCell(props) {
  return props.content;
}
RenderCell.props = ["content"];
