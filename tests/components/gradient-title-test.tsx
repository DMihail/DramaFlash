import TestRenderer, { act } from 'react-test-renderer';

import { GradientTitle } from '@/components/GradientTitle';

function textProps(align?: 'start' | 'center') {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(
      <GradientTitle size={26} {...(align ? { align } : {})}>
        starts here.
      </GradientTitle>,
    );
  });
  if (!renderer) {
    throw new Error('expected a title');
  }

  // The first match is the SVG Text element; host nodes below it may repeat props.
  const [text] = renderer.root.findAll(
    (node) => node.props.fontSize === 26 && 'textAnchor' in node.props,
  );
  if (!text) {
    throw new Error('expected SVG text');
  }

  return text.props as { textAnchor?: string; x?: number };
}

describe('GradientTitle', () => {
  test('draws from the left edge by default', () => {
    const props = textProps();

    expect(props.textAnchor).toBe('start');
    expect(props.x).toBe(0);
  });

  test('centers the text inside its estimated box', () => {
    const props = textProps('center');
    const boxWidth = Math.ceil('starts here.'.length * 26 * 0.72);

    expect(props.textAnchor).toBe('middle');
    expect(props.x).toBe(boxWidth / 2);
  });
});
