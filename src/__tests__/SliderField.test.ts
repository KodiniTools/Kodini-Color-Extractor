import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SliderField from '../components/ui/SliderField.vue'

function mountField(props: Record<string, unknown> = {}) {
  return mount(SliderField, {
    props: { modelValue: 100, min: 0, max: 200, step: 1, unit: '%', label: 'Helligkeit', ...props },
  })
}

describe('SliderField', () => {
  it('renders label, range, spinner and reset in one control', () => {
    const w = mountField({ defaultValue: 100, inputId: 'x-brightness' })
    expect(w.find('label').text()).toBe('Helligkeit')
    expect(w.find('label').attributes('for')).toBe('x-brightness')
    const range = w.find('input[type="range"]')
    expect(range.attributes()).toMatchObject({
      id: 'x-brightness',
      min: '0',
      max: '200',
      step: '1',
    })
    expect(w.findComponent({ name: 'NumberSpinner' }).props()).toMatchObject({
      modelValue: 100,
      min: 0,
      max: 200,
      step: 1,
      unit: '%',
    })
    expect(w.find('.slider-field__reset').exists()).toBe(true)
  })

  it('has no reset button without a default value', () => {
    expect(mountField().find('.slider-field__reset').exists()).toBe(false)
  })

  it('emits numbers from the range input', async () => {
    const w = mountField()
    await w.find('input[type="range"]').setValue('140')
    expect(w.emitted('update:modelValue')).toEqual([[140]])
  })

  it('forwards spinner changes', async () => {
    const w = mountField()
    await w.findComponent({ name: 'NumberSpinner' }).vm.$emit('update:modelValue', 7)
    expect(w.emitted('update:modelValue')).toEqual([[7]])
  })

  it('disables reset at the default and names the default in the tooltip', () => {
    const w = mountField({ defaultValue: 100 })
    const reset = w.find('.slider-field__reset')
    expect(reset.attributes('disabled')).toBeDefined()
    expect(reset.attributes('title')).toBe('Zurücksetzen (100%)')
  })

  it('emits only reset when the reset button is clicked', async () => {
    const w = mountField({ modelValue: 150, defaultValue: 100 })
    await w.find('.slider-field__reset').trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('disables every part while disabled', () => {
    const w = mountField({ modelValue: 150, defaultValue: 100, disabled: true })
    expect(w.find('input[type="range"]').attributes('disabled')).toBeDefined()
    expect(w.find('.slider-field__reset').attributes('disabled')).toBeDefined()
    expect(w.findComponent({ name: 'NumberSpinner' }).props('disabled')).toBe(true)
  })

  it('paints a hue track for the hue variant', () => {
    const w = mountField({ variant: 'hue' })
    expect(w.find('input[type="range"]').classes()).toContain('slider-field__range--hue')
  })
})
