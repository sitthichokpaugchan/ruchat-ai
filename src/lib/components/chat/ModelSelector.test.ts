import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ModelSelector from './ModelSelector.svelte';
import { models, settings } from '$lib/stores';
import { get } from 'svelte/store';
import toast from 'svelte-french-toast';

// จำลอง (mock) svelte stores
vi.mock('$lib/stores', () => {
  const { writable } = require('svelte/store');
  return {
    models: writable([
      { name: 'llama2', details: { family: 'llama', parameter_size: '7B' } },
      { name: 'mistral', details: { family: 'mistral', parameter_size: '7B' } },
      { name: 'hr' }, // ตัวคั่น
      { name: 'codellama', details: { family: 'codellama', parameter_size: '7B' } },
    ]),
    settings: writable({
      ollamaApiBaseUrl: 'http://localhost:11434',
      authHeader: null,
      notificationEnabled: false,
      responseAutoCopy: false,
      titleAutoGenerate: true,
      models: [], // การตั้งค่าโมเดลเริ่มต้น
    }),
  };
});

// จำลอง (mock) svelte-french-toast
vi.mock('svelte-french-toast', () => {
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
  };
  return {
    default: toast,
    toast: toast
  };
});

describe('ModelSelector', () => {
  // สถานการณ์ที่ 1: การเลือกโมเดล
  it('ควรแสดงตัวเลือกโมเดลและอนุญาตให้เลือก', async () => {
    let selectedModels = [''];
    render(ModelSelector, { props: { selectedModels, disabled: false } });

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();

    // ตรวจสอบว่าตัวเลือกถูกแสดงผลหรือไม่
    expect(screen.getByRole('option', { name: 'เลือกโมเดล' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'llama2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'mistral' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'codellama' })).toBeInTheDocument();

    // เลือกโมเดล
    await fireEvent.change(selectElement, { target: { value: 'llama2' } });

    // สำหรับการทดสอบนี้ เราจะยืนยันว่าค่าขององค์ประกอบ select เปลี่ยนแปลง
    expect(selectElement.value).toBe('llama2');
  });

  it('ควรปิดใช้งานตัวเลือกเมื่อ `disabled` prop เป็น true', () => {
    let selectedModels = [''];
    render(ModelSelector, { props: { selectedModels, disabled: true } });

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeDisabled();
  });



  it('ควรบันทึกโมเดลที่เลือกเป็นค่าเริ่มต้นและแสดง toast สำเร็จ', async () => {
    let selectedModels = ['llama2']; // จำลองโมเดลที่เลือก
    render(ModelSelector, { props: { selectedModels, disabled: false } });

    const setDefaultButton = screen.getByRole('button', { name: 'ตั้งเป็นค่าเริ่มต้น' });
    await fireEvent.click(setDefaultButton);

    expect(get(settings).models).toEqual(['llama2']);
    expect(toast.success).toHaveBeenCalledWith('ตั้งเป็นโมเดลเริ่มต้นแล้ว');
  });

  // สถานการณ์ที่ 2: การลบโมเดล
  it('ควรตอบสนองอย่างถูกต้องหากโมเดลถูกลบออกจาก models store', async () => {
    let selectedModels = ['llama2'];
    const { rerender } = render(ModelSelector, { props: { selectedModels, disabled: false } });

    // ในตอนแรก llama2 ควรจะปรากฏ
    expect(screen.getByRole('option', { name: 'llama2' })).toBeInTheDocument();

    // จำลองการลบโมเดลโดยการอัปเดต models store
    models.set([
      { name: 'mistral', details: { family: 'mistral', parameter_size: '7B' } },
      { name: 'codellama', details: { family: 'codellama', parameter_size: '7B' } },
    ]);

    // คอมโพเนนต์ Svelte ตอบสนองต่อการเปลี่ยนแปลง store โดยอัตโนมัติ เราใช้ waitFor เพื่อให้แน่ใจว่า DOM อัปเดต
    await screen.findByText('mistral'); // รอให้ mistral ปรากฏ

    // llama2 ไม่ควรมีอยู่
    expect(screen.queryByRole('option', { name: 'llama2' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'mistral' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'codellama' })).toBeInTheDocument();
  });
});
