import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

import Button from './Button.vue'

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me',
      },
    })

    expect(wrapper.text()).toContain('Click me')
    expect(wrapper.classes()).toContain('btn')
  })

  it('renders with primary variant class', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
      },
      slots: {
        default: 'Primary Button',
      },
    })

    expect(wrapper.text()).toContain('Primary Button')
    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('renders with ghost variant class', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'ghost',
      },
      slots: {
        default: 'Ghost Button',
      },
    })

    expect(wrapper.classes()).toContain('btn-ghost')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Clickable Button',
      },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('renders with icon slot', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Button with Icon',
        icon: '<span class="icon">Icon</span>',
      },
    })

    expect(wrapper.text()).toContain('Button with Icon')
    expect(wrapper.html()).toContain('class="icon"')
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true,
      },
      slots: {
        default: 'Disabled Button',
      },
    })

    expect(wrapper.attributes('disabled')).toBe('')
    expect(wrapper.classes()).toContain('disabled')
  })

  it('renders with custom class', () => {
    const wrapper = mount(Button, {
      props: {
        class: 'custom-class',
      },
      slots: {
        default: 'Button with custom class',
      },
    })

    expect(wrapper.classes()).toContain('custom-class')
  })

  it('renders with small size', () => {
    const wrapper = mount(Button, {
      props: {
        size: 'sm',
      },
      slots: {
        default: 'Small Button',
      },
    })

    expect(wrapper.classes()).toContain('btn-sm')
  })

  it('renders with large size', () => {
    const wrapper = mount(Button, {
      props: {
        size: 'lg',
      },
      slots: {
        default: 'Large Button',
      },
    })

    expect(wrapper.classes()).toContain('btn-lg')
  })
})
